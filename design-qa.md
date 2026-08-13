# Loading 组件设计 QA

- source visual truth path: `F:\codex文件\loading\loading-design-brief.md`
- implementation screenshots:
  - `F:\codex文件\loading\loading-qa-ring.png`
  - `F:\codex文件\loading\loading-qa-dots.png`
  - `F:\codex文件\loading\loading-qa-line.png`
  - `F:\codex文件\loading\loading-qa-icon.png`
- viewport: `1600 × 900`
- source dimensions: 文字设计规格，无像素密度；implementation: `1600 × 900` CSS px，density `1`。
- state: 装饰组件 → loading，四个系统预设默认状态。

## Full-view comparison evidence

- 四个预设均位于现有装饰组件框架内，没有改变一级导航、中间画布、右侧参数栏和播放控制结构。
- 暗色表面、品牌蓝、低对比轨道、像素格画布和参数控件沿用项目现有设计系统。
- 旋转圆环、点序呼吸、线性流光和图标脉冲均完整显示在画布中央，没有裁切或溢出。

## Focused region comparison evidence

- 左侧缩略图与主预览使用相同生成器，四个缩略图均为真实动效而非截图。
- 右侧参数只显示当前 Loading 所需字段；图标脉冲单独显示“导入 SVG”，其余 Loading 不显示无效导入入口。
- 代码视图包含当前 Loading 的独立 HTML 与 CSS，并保持语法高亮。

## Findings

- 未发现 P0/P1/P2 问题。
- 字体与排版：沿用现有字号、字重和行高，标题、说明及参数层级一致。
- 间距与布局：左侧四个案例、中央画布和右侧参数没有挤压或溢出。
- 颜色与视觉令牌：主色使用 `#0070F3`，轨道使用低对比灰蓝，光效克制。
- 图像与素材：图标脉冲默认图标为可缩放 SVG；导入 SVG 使用项目现有安全内联解析能力。
- 文案与内容：名称、说明和使用场景与设计目标一致。

## Comparison history

- 初次检查发现 Loading 页面仍显示共用“附加效果 / 粒子效果”，与四个通用 Loading 的最小参数目标重复。
- 修复：Loading 分类隐藏附加粒子面板，保留四个 Loading 自身专属参数；其他装饰组件粒子能力不受影响。
- 修复后：类型检查、生产构建和 Edge 控制台检查通过。

## Interactions tested

- 切换 loading 分类与四个预设。
- 参数面板按预设切换。
- 动效预览持续播放与重播入口。
- 代码展示包含当前 Loading HTML/CSS。
- 图标脉冲显示 SVG 导入入口，其他三个预设不显示。
- Edge 控制台无页面错误。

final result: passed
