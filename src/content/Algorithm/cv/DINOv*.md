## 4D Anchor

"4D anchor"就是用 4 个参数（4 维向量）描述一个候选边界框，是目标检测模型在图像平面空间中预测目标位置的基准参考框。

## Attention 调制

### 基本概念

Attention 机制（注意力机制）是让模型在处理信息时，按不同权重聚焦于输入的不同部分。Transformer 里的 self-attention，它能根据上下文动态分配关注度。

Attention 调制指的是通过额外的信号、参数或条件，动态地影响或改变注意力权重的分布，从而让模型在不同情境下关注的信息不同。

### 常见调制方式

#### 1. 乘性调制（Multiplicative Modulation）
- 在计算注意力权重之前或之后，引入一个"门控"信号（gate），对注意力分数进行按元素相乘
- 例子：视觉-语言任务中，用文本向量去调节图像的注意力图

#### 2. 加性调制（Additive Modulation）
- 在 logits（未 softmax 的注意力分数）上加上一个来自外部条件的偏置，从而改变 softmax 分布
- 例子：在多模态模型中，用声音情绪信号去增强对应语义词的注意力

#### 3. 条件调制（Conditional Modulation）
- 根据不同的输入条件（condition），动态调整 attention 的参数（比如 Q/K/V 的投影矩阵），达到不同的关注模式
- 例子：StyleGAN、FiLM（Feature-wise Linear Modulation）在生成图片时也有类似调制思想


dn detr deformable detr
contitional detr
acher detr
dn detr 去噪训练 对比去噪训练
deformable detr
two stage

patch 特征可视化
gram anchoring 矩阵 class tocken涵盖patch tocken 全局能力过强 细节表征能力退化

自监督预训练 无需标签的自蒸馏方法

contrastive learning 对纹理细节不敏感 主要关注低频信息

masked image modeling 捕捉局部关系 关注高频特征 细节纹理敏感

好的特征应该是task-agnostic的

L_iBOT 对比损失 重建损失 
