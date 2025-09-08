# 提升模型全局注意力的方法论与实践

在计算机视觉任务中，让模型"看到"整张图像的全局上下文是提升性能的关键。本文系统梳理了从模型架构、训练策略到推理优化的全方位解决方案。

## 为什么需要全局注意力？

许多视觉任务需要理解图像的全局上下文：
- **小目标检测**：需要从全局背景中定位微小物体
- **语义分割**：需要理解场景的整体布局
- **图像理解**：需要把握图像的整体语义
- **细粒度识别**：需要关注远距离的判别性特征

## 一、模型结构层面的优化

### 1. 显式全局自注意力

#### Vision Transformer (ViT/DeiT)
```python
# ViT 的全局自注意力机制
class GlobalSelfAttention(nn.Module):
    def __init__(self, dim, num_heads=8):
        super().__init__()
        self.num_heads = num_heads
        self.scale = (dim // num_heads) ** -0.5
        self.qkv = nn.Linear(dim, dim * 3)
        
    def forward(self, x):
        B, N, C = x.shape  # N 是 token 数量
        qkv = self.qkv(x).reshape(B, N, 3, self.num_heads, C // self.num_heads)
        q, k, v = qkv.unbind(2)
        
        # 所有 token 两两交互
        attn = (q @ k.transpose(-2, -1)) * self.scale
        attn = attn.softmax(dim=-1)
        x = (attn @ v).reshape(B, N, C)
        return x
```

**优点**：天然具备全局感受野  
**缺点**：计算复杂度 O(N²)，内存消耗大

#### 全局 Token / 记忆 Token
借鉴 Longformer/BigBird 思路，在局部注意力模型中引入少量"全局摘要"token：

```python
class GlobalTokenAttention(nn.Module):
    def __init__(self, dim, num_global_tokens=4):
        super().__init__()
        self.global_tokens = nn.Parameter(torch.randn(1, num_global_tokens, dim))
        self.local_attn = WindowAttention(dim)
        self.global_attn = nn.MultiheadAttention(dim, num_heads=8)
    
    def forward(self, x):
        B, L, C = x.shape
        # 扩展全局 token
        global_tokens = self.global_tokens.expand(B, -1, -1)
        
        # 局部窗口与全局 token 交互
        x_local = self.local_attn(x)
        x_with_global = torch.cat([global_tokens, x_local], dim=1)
        x_global = self.global_attn(x_with_global, x_with_global, x_with_global)[0]
        
        return x_global[:, self.num_global_tokens:]
```

### 2. 非局部块 (Non-Local Block)

给 CNN 或混合模型插入非局部块，显著提高长距依赖建模能力：

```python
class NonLocalBlock(nn.Module):
    def __init__(self, in_channels):
        super().__init__()
        self.inter_channels = in_channels // 2
        self.theta = nn.Conv2d(in_channels, self.inter_channels, 1)
        self.phi = nn.Conv2d(in_channels, self.inter_channels, 1)
        self.g = nn.Conv2d(in_channels, self.inter_channels, 1)
        self.out = nn.Conv2d(self.inter_channels, in_channels, 1)
        
    def forward(self, x):
        B, C, H, W = x.shape
        
        # 计算相似度矩阵
        theta_x = self.theta(x).view(B, self.inter_channels, -1).permute(0, 2, 1)
        phi_x = self.phi(x).view(B, self.inter_channels, -1)
        f = torch.matmul(theta_x, phi_x)  # (B, HW, HW)
        f = F.softmax(f, dim=-1)
        
        # 聚合全局特征
        g_x = self.g(x).view(B, self.inter_channels, -1).permute(0, 2, 1)
        y = torch.matmul(f, g_x).permute(0, 2, 1)
        y = y.view(B, self.inter_channels, H, W)
        y = self.out(y)
        
        return x + y  # 残差连接
```

### 3. 大核卷积与扩张卷积

使用更大的卷积核或扩张卷积扩大感受野：

```python
class LargeKernelConv(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size=31):
        super().__init__()
        # 使用深度可分离卷积降低参数量
        self.depthwise = nn.Conv2d(
            in_channels, in_channels, kernel_size,
            padding=kernel_size//2, groups=in_channels
        )
        self.pointwise = nn.Conv2d(in_channels, out_channels, 1)
        
    def forward(self, x):
        x = self.depthwise(x)
        x = self.pointwise(x)
        return x

# 扩张卷积
class DilatedConvBlock(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, padding=1, dilation=1)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=2, dilation=2)
        self.conv3 = nn.Conv2d(out_channels, out_channels, 3, padding=4, dilation=4)
        
    def forward(self, x):
        x = self.conv1(x)
        x = self.conv2(x)
        x = self.conv3(x)
        return x
```

### 4. 金字塔池化模块 (PPM/ASPP)

多尺度池化聚合全局上下文：

```python
class PyramidPoolingModule(nn.Module):
    def __init__(self, in_channels, pool_sizes=[1, 2, 3, 6]):
        super().__init__()
        self.stages = nn.ModuleList([
            nn.Sequential(
                nn.AdaptiveAvgPool2d(size),
                nn.Conv2d(in_channels, in_channels // len(pool_sizes), 1)
            ) for size in pool_sizes
        ])
        self.fusion = nn.Conv2d(
            in_channels + in_channels // len(pool_sizes) * len(pool_sizes),
            in_channels, 1
        )
        
    def forward(self, x):
        H, W = x.shape[2:]
        pyramids = [x]
        
        for stage in self.stages:
            pyramid = stage(x)
            pyramid = F.interpolate(pyramid, size=(H, W), mode='bilinear')
            pyramids.append(pyramid)
            
        return self.fusion(torch.cat(pyramids, dim=1))
```

### 5. 通道/空间注意力机制

#### SE (Squeeze-and-Excitation)
```python
class SEBlock(nn.Module):
    def __init__(self, channels, reduction=16):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(channels, channels // reduction),
            nn.ReLU(inplace=True),
            nn.Linear(channels // reduction, channels),
            nn.Sigmoid()
        )
        
    def forward(self, x):
        B, C, _, _ = x.shape
        # 全局池化获取通道级摘要
        y = self.avg_pool(x).view(B, C)
        # 学习通道间依赖
        y = self.fc(y).view(B, C, 1, 1)
        return x * y
```

#### CBAM (Convolutional Block Attention Module)
```python
class CBAM(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.channel_attention = ChannelAttention(channels)
        self.spatial_attention = SpatialAttention()
        
    def forward(self, x):
        x = x * self.channel_attention(x)
        x = x * self.spatial_attention(x)
        return x
```

### 6. 窗口注意力 + 跨窗连接

Swin Transformer 的移位窗口机制：

```python
class ShiftedWindowAttention(nn.Module):
    def __init__(self, dim, window_size=7, shift_size=3):
        super().__init__()
        self.window_size = window_size
        self.shift_size = shift_size
        self.attn = WindowAttention(dim, window_size)
        
    def forward(self, x):
        H, W = x.shape[1:3]
        
        # 移位
        if self.shift_size > 0:
            x = torch.roll(x, shifts=(-self.shift_size, -self.shift_size), dims=(1, 2))
        
        # 窗口划分与注意力
        x_windows = window_partition(x, self.window_size)
        attn_windows = self.attn(x_windows)
        x = window_reverse(attn_windows, self.window_size, H, W)
        
        # 反移位
        if self.shift_size > 0:
            x = torch.roll(x, shifts=(self.shift_size, self.shift_size), dims=(1, 2))
            
        return x
```

## 二、训练与数据策略

### 1. 多尺度与多视角训练

```python
class MultiScaleAugmentation:
    def __init__(self, scales=[0.5, 1.0, 1.5]):
        self.scales = scales
        
    def __call__(self, image):
        # 全局视图
        global_view = transforms.Resize(224)(image)
        
        # 多个局部视图
        local_views = []
        for scale in self.scales:
            size = int(224 * scale)
            crop = transforms.RandomCrop(size)(image)
            crop = transforms.Resize(96)(crop)
            local_views.append(crop)
            
        return global_view, local_views
```

### 2. 一致性与对比学习

```python
class GlobalLocalConsistencyLoss(nn.Module):
    def __init__(self, temperature=0.1):
        super().__init__()
        self.temperature = temperature
        
    def forward(self, global_feat, local_feats):
        # 归一化特征
        global_feat = F.normalize(global_feat, dim=-1)
        local_feats = F.normalize(local_feats, dim=-1)
        
        # 计算全局-局部一致性
        similarity = torch.matmul(global_feat, local_feats.T) / self.temperature
        
        # 对比损失
        labels = torch.arange(len(global_feat)).to(global_feat.device)
        loss = F.cross_entropy(similarity, labels)
        
        return loss
```

### 3. MAE 风格的掩码预训练

```python
class MaskedAutoEncoder(nn.Module):
    def __init__(self, encoder, decoder, mask_ratio=0.75):
        super().__init__()
        self.encoder = encoder
        self.decoder = decoder
        self.mask_ratio = mask_ratio
        
    def forward(self, x):
        # 随机遮挡 patches
        B, L, D = x.shape
        num_mask = int(L * self.mask_ratio)
        
        # 随机选择要遮挡的 patches
        noise = torch.rand(B, L, device=x.device)
        ids_shuffle = torch.argsort(noise, dim=1)
        ids_keep = ids_shuffle[:, :L-num_mask]
        
        # 编码可见 patches
        x_visible = torch.gather(x, dim=1, index=ids_keep.unsqueeze(-1).expand(-1, -1, D))
        latent = self.encoder(x_visible)
        
        # 解码重建整图
        pred = self.decoder(latent, ids_keep, ids_shuffle)
        
        return pred
```

## 三、推理阶段优化

### 1. 滑窗 + 全局特征回流

```python
class SlidingWindowInference:
    def __init__(self, window_size=512, overlap=128):
        self.window_size = window_size
        self.overlap = overlap
        
    def __call__(self, model, image):
        # 先用低分辨率获取全局特征
        global_feat = model(F.interpolate(image, size=(224, 224)))
        
        # 滑窗处理高分辨率
        H, W = image.shape[-2:]
        stride = self.window_size - self.overlap
        output = torch.zeros_like(image)
        count = torch.zeros_like(image)
        
        for h in range(0, H-self.window_size+1, stride):
            for w in range(0, W-self.window_size+1, stride):
                window = image[:, :, h:h+self.window_size, w:w+self.window_size]
                # 融合全局特征
                pred = model(window, global_context=global_feat)
                output[:, :, h:h+self.window_size, w:w+self.window_size] += pred
                count[:, :, h:h+self.window_size, w:w+self.window_size] += 1
                
        return output / count
```

### 2. Test-Time Augmentation (TTA)

```python
def test_time_augmentation(model, image):
    # 多尺度测试
    scales = [0.75, 1.0, 1.25]
    predictions = []
    
    for scale in scales:
        # 缩放
        size = tuple(int(s * scale) for s in image.shape[-2:])
        scaled = F.interpolate(image, size=size)
        
        # 预测
        pred = model(scaled)
        
        # 恢复原始尺寸
        pred = F.interpolate(pred, size=image.shape[-2:])
        predictions.append(pred)
        
        # 水平翻转
        pred_flip = model(torch.flip(scaled, dims=[-1]))
        pred_flip = torch.flip(pred_flip, dims=[-1])
        pred_flip = F.interpolate(pred_flip, size=image.shape[-2:])
        predictions.append(pred_flip)
    
    # 聚合所有预测
    return torch.mean(torch.stack(predictions), dim=0)
```

## 四、诊断与可视化

### 1. 注意力可视化

```python
def visualize_attention_rollout(model, image):
    """
    可视化 Transformer 的注意力分布
    """
    attentions = []
    
    def hook_fn(module, input, output):
        attentions.append(output[1])  # 保存注意力权重
    
    # 注册 hook
    for layer in model.transformer.layers:
        layer.attn.register_forward_hook(hook_fn)
    
    # 前向传播
    _ = model(image)
    
    # Attention Rollout
    attn_rollout = torch.eye(attentions[0].size(-1))
    for attn in attentions:
        attn_rollout = torch.matmul(attn, attn_rollout)
    
    return attn_rollout

def grad_cam_visualization(model, image, target_layer):
    """
    使用 Grad-CAM 可视化模型关注区域
    """
    gradients = []
    activations = []
    
    def backward_hook(module, grad_in, grad_out):
        gradients.append(grad_out[0])
    
    def forward_hook(module, input, output):
        activations.append(output)
    
    # 注册 hooks
    handle_forward = target_layer.register_forward_hook(forward_hook)
    handle_backward = target_layer.register_backward_hook(backward_hook)
    
    # 前向传播
    output = model(image)
    output.backward()
    
    # 计算 Grad-CAM
    grad = gradients[0]
    activation = activations[0]
    weights = torch.mean(grad, dim=(2, 3), keepdim=True)
    cam = torch.sum(weights * activation, dim=1)
    cam = F.relu(cam)
    
    return cam
```

## 五、实践建议与取舍

### 场景化方案选择

| 场景 | 推荐方案 | 理由 |
|-----|---------|------|
| **小目标检测** | PPM + 大核卷积 + P2 检测层 | 保持细节同时增强全局 |
| **语义分割** | ASPP + Non-Local + 多尺度训练 | 需要精确的像素级全局理解 |
| **图像分类** | ViT + MAE 预训练 | 全局语义理解最重要 |
| **密集预测** | Swin + 全局 token | 平衡局部精度与全局感知 |

### 计算资源权衡

```python
# 根据显存选择策略
def select_global_strategy(gpu_memory_gb):
    if gpu_memory_gb >= 24:
        # 充足显存：全局自注意力
        return "full_global_attention"
    elif gpu_memory_gb >= 12:
        # 中等显存：窗口注意力 + 全局 token
        return "window_attention_with_global_tokens"
    else:
        # 有限显存：轻量级全局模块
        return "lightweight_global_modules"
```

### 常见陷阱与解决

1. **过度平滑问题**
   - 问题：过强的全局聚合削弱局部细节
   - 解决：采用层级设计，低层局部、高层全局

2. **计算爆炸**
   - 问题：全局注意力 O(N²) 复杂度
   - 解决：稀疏注意力、近似方法、分块处理

3. **训练不稳定**
   - 问题：大感受野导致梯度传播困难
   - 解决：渐进式训练、辅助损失、残差连接

## 六、落地示例配方

### 配方 1：给 CNN 加全局感知（成本最低）

```python
class GlobalEnhancedCNN(nn.Module):
    def __init__(self, backbone):
        super().__init__()
        self.backbone = backbone
        # 在后 1/3 处插入
        self.non_local = NonLocalBlock(256)
        # 顶层加 PPM
        self.ppm = PyramidPoolingModule(512)
        # 最后加 SE
        self.se = SEBlock(512)
        
    def forward(self, x):
        features = []
        for i, layer in enumerate(self.backbone):
            x = layer(x)
            if i == len(self.backbone) * 2 // 3:
                x = self.non_local(x)
            features.append(x)
        
        x = self.ppm(x)
        x = self.se(x)
        return x
```

### 配方 2：Swin 增强全局（中等成本）

```python
class GlobalSwinTransformer(nn.Module):
    def __init__(self, swin_model, num_global_tokens=4):
        super().__init__()
        self.swin = swin_model
        self.global_tokens = nn.Parameter(
            torch.randn(1, num_global_tokens, swin_model.embed_dim)
        )
        # 每个 stage 结束加小规模全局注意力
        self.global_attns = nn.ModuleList([
            nn.MultiheadAttention(dim, num_heads=8)
            for dim in swin_model.dims
        ])
        
    def forward(self, x):
        B = x.shape[0]
        global_tokens = self.global_tokens.expand(B, -1, -1)
        
        for stage, global_attn in zip(self.swin.stages, self.global_attns):
            x = stage(x)
            # 降采样后与全局 token 交互
            x_flat = x.flatten(2).transpose(1, 2)
            x_with_global = torch.cat([global_tokens, x_flat], dim=1)
            x_global = global_attn(x_with_global, x_with_global, x_with_global)[0]
            x = x_global[:, self.num_global_tokens:].transpose(1, 2).reshape_as(x)
            
        return x
```

### 配方 3：自监督预训练（效果最好但需要时间）

```python
# 使用 MAE 或 DINO 预训练
def pretrain_with_global_view():
    model = VisionTransformer()
    optimizer = AdamW(model.parameters(), lr=1e-4)
    
    # DINO 风格：大小 crop 混合
    transform = MultiCropTransform(
        global_crops_scale=(0.4, 1.0),
        local_crops_scale=(0.05, 0.4),
        n_local_crops=8
    )
    
    for epoch in range(100):
        for images in dataloader:
            global_views, local_views = transform(images)
            
            # 学生看局部，教师看全局
            student_out = model(local_views)
            with torch.no_grad():
                teacher_out = model_ema(global_views)
            
            # 匹配全局-局部分布
            loss = kl_divergence(student_out, teacher_out)
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            # EMA 更新教师
            update_ema(model_ema, model, 0.999)
```

## 总结

提升模型全局注意力需要在架构、训练、推理三个层面综合优化：

1. **架构层面**：根据任务特点选择合适的全局模块
2. **训练层面**：通过多尺度、掩码、对比学习强化全局感知
3. **推理层面**：利用 TTA、滑窗等技巧提升效果

关键是根据具体任务的需求和计算资源限制，选择合适的技术组合。记住：全局注意力不是越多越好，而是要在局部细节和全局语义之间找到平衡。