# Welcome to my paper nodebook

Here's my research on deep learning.

## Computer Vision

### 目标检测 (Object Detection)
- [DINO - 自监督视觉Transformer](./cv/DINO.md)
- [YOLO vs DETR - 小目标检测架构对比与优化](./cv/yolo_vs_detr_small_object_detection.md)
- [YOLO 系列小目标检测优化完全指南](./cv/yolo_small_object_detection_optimization.md)

### 注意力机制 (Attention Mechanisms)
- [提升模型全局注意力的方法论与实践](./cv/global_attention_enhancement.md)

## [Reinforce Learning](./rl/index.md)

### On-policy vs Off-policy

|          |                      On-policy                       |                       Off-policy                       |
| :------: | :--------------------------------------------------: | :----------------------------------------------------: |
| **优点** |       实现更简单<br>训练更稳定<br>理论保证更强       | 更好的样本效率<br>可以重用历史数据<br>可以从演示中学习 |
| **缺点** | 样本效率低<br>需要频繁收集新数据<br>不能重用历史数据 |  实现更复杂<br>训练可能不稳定<br>需要更多的超参数调整  |
