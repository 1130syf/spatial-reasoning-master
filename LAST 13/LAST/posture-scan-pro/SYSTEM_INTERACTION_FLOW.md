# 姿态分析系统交互流程设计图

## 系统概览
这是一个基于MediaPipe姿态检测的运动训练分析系统，包含深蹲、二头弯举等运动的实时分析和训练报告生成功能。

## 核心交互流程

```mermaid
graph TB
    Start[用户进入系统] --> Home[首页/HomePage]

    Home --> Choose{选择功能模块}
    Choose --> |姿态分析| Posture[姿态分析模块]
    Choose --> |人员管理| Personnel[人员管理模块]
    Choose --> |查看报告| Reports[报告查看模块]

    %% 姿态分析流程
    Posture --> Exercise{选择运动类型}
    Exercise --> |深蹲训练| SquatPage[深蹲分析页面]
    Exercise --> |二头弯举| BicepPage[二头弯举分析页面]
    Exercise --> |脊柱分析| SpinalPage[脊柱分析页面]

    %% 深蹲训练详细流程
    SquatPage --> PatientSelect[用户选择/创建]
    PatientSelect --> SetupPhase[训练设置阶段]

    SetupPhase --> SetTarget{设置目标次数}
    SetTarget --> |用户已选择| StartTraining[开始训练]
    SetTarget --> |未选择用户| ShowPatientModal[显示用户选择弹窗]

    ShowPatientModal --> SelectUser[选择现有用户]
    SelectUser --> StartTraining

    StartTraining --> CameraInit[摄像头初始化]
    CameraInit --> PoseDetection[MediaPipe姿态检测]
    PoseDetection --> RealTimeAnalysis[实时分析]

    RealTimeAnalysis --> StateMachine{状态机控制}
    StateMachine --> |IDLE| IdleState[等待状态]
    StateMachine --> |SQUATTING| SquatState[深蹲状态]
    StateMachine --> |ANALYZING| AnalyzeState[分析状态]
    StateMachine --> |COMPLETE| CompleteState[训练完成]

    %% 分析和反馈
    RealTimeAnalysis --> SkeletonDrawing[骨骼绘制<br/>🔴头部 🟣躯干 🟠上肢 🟢下肢]
    SkeletonDrawing --> PostureAnalysis[姿态分析算法]
    PostureAnalysis --> Feedback[实时反馈]

    %% 训练完成流程
    CompleteState --> GenerateReport[生成训练报告]
    GenerateReport --> SaveToDB[保存到数据库]
    SaveToDB --> ShowReport[显示报告详情]

    %% 二头弯举流程（类似深蹲）
    BicepPage --> BicepPatient[用户选择]
    BicepPatient --> BicepSetup[二头弯举设置]
    BicepSetup --> BicepTraining[开始二头弯举训练]
    BicepTraining --> BicepAnalysis[实时二头弯举分析]
    BicepAnalysis --> BicepReport[二头弯举报告]

    %% 脊柱分析流程
    SpinalPage --> SpinalDetection[脊柱姿态检测]
    SpinalDetection --> SpinalAnalysis[脊柱曲率分析]
    SpinalAnalysis --> SpinalReport[脊柱分析报告]

    %% 人员管理
    Personnel --> PatientMgmt[患者管理]
    PatientMgmt --> AddPatient[添加新用户]
    PatientMgmt --> EditPatient[编辑用户信息]
    PatientMgmt --> DeletePatient[删除用户]

    %% 报告查看
    Reports --> ReportList[报告列表]
    ReportList --> ReportDetail[报告详情页]
    ReportDetail --> ExportReport[导出报告]

    %% 数据流
    Posture --> Database[MySQL数据库]
    Personnel --> Database
    Reports --> Database

    Database --> |存储| Tables[数据表结构]
    Tables --> Patients[patients表 - 用户信息]
    Tables --> ExerciseReports[exercise_reports表 - 运动报告]
    Tables --> RepDetails[exercise_rep_details表 - 重复详情]

    %% API层
    Database --> Backend[Express.js后端API]
    Backend --> |REST API| Frontend[React前端]

    %% 实时数据处理
    PoseDetection --> |33个关键点| Landmarks[MediaPipe Landmarks]
    Landmarks --> |实时姿态数据| AnalysisEngine[分析引擎]
    AnalysisEngine --> |关节角度| JointAngles[关节角度计算]
    AnalysisEngine --> |运动质量| QualityMetrics[质量指标]

    %% 状态管理
    Frontend --> ReactState[React状态管理]
    ReactState --> UseState[useState Hook]
    ReactState --> UseReducer[useReducer Hook]
    ReactState --> UseRef[useRef Hook]

    %% 组件架构
    Frontend --> Components[组件架构]
    Components --> CaptureComponents[捕获组件]
    Components --> AnalysisComponents[分析组件]
    Components --> ReportComponents[报告组件]

    CaptureComponents --> CameraFeed[摄像头组件]
    CaptureComponents --> Canvas[Canvas绘制组件]
    CaptureComponents --> SettingsPanel[设置面板]

    AnalysisComponents --> ExerciseHUD[训练HUD]
    AnalysisComponents --> MetricsOverlay[指标叠加]
    AnalysisComponents --> DiagramOverlay[姿态图解]

    ReportComponents --> SessionReport[会话报告]
    ReportComponents --> ExerciseReportDetail[详细报告]

%% 样式定义
classDef mainFlow fill:#e1f5fe,stroke:#01579b,stroke-width:2px
classDef analysis fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
classDef data fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
classDef components fill:#fff3e0,stroke:#e65100,stroke-width:2px

class Start,Home,Choose,Posture,Personnel,Reports mainFlow
class RealTimeAnalysis,SkeletonDrawing,PostureAnalysis,Feedback analysis
class Database,Tables,Backend,Frontend data
class Components,CaptureComponents,AnalysisComponents,ReportComponents components
```

## 详细组件交互图

```mermaid
graph LR
    %% 页面层级结构
    App[App.js] --> HomePage[首页]
    App --> ExerciseAnalysis[运动分析页面]
    App --> Personnel[人员管理]
    App --> Reports[报告页面]

    %% 运动分析页面组件
    ExerciseAnalysis --> SquatSetup[深蹲设置组件]
    ExerciseAnalysis --> Webcam[摄像头组件]
    ExerciseAnalysis --> Canvas[Canvas绘制]
    ExerciseAnalysis --> AnalysisPanel[分析面板]
    ExerciseAnalysis --> ExerciseHUD[训练HUD]
    ExerciseAnalysis --> SessionReport[会话报告]

    %% 姿态检测子组件
    Canvas --> DiagramOverlay[姿态图解]
    Canvas --> MetricsOverlay[指标叠加]
    Canvas --> SettingsPanel[设置面板]

    %% 数据流
    Webcam --> |视频流| MediaPipe[MediaPipe]
    MediaPipe --> |姿态数据| DrawingUtils[绘制工具]
    DrawingUtils --> |绘制指令| Canvas

    %% 状态管理
    ExerciseAnalysis --> useReducer[useReducer状态机]
    useReducer --> SessionState[会话状态]
    useReducer --> ExerciseState[运动状态]
    useReducer --> MetricsState[指标状态]

    %% 数据库交互
    ExerciseAnalysis --> API[API调用]
    API --> Backend[后端服务]
    Backend --> MySQL[MySQL数据库]
```

## 状态机转换图

```mermaid
stateDiagram-v2
    [*] --> LOADING: 页面加载
    LOADING --> CONFIG: 加载完成
    LOADING --> MOTION_CORRECTION: 加载失败

    CONFIG --> IDLE: 选择用户并开始
    IDLE --> SQUATTING: 检测到深蹲动作
    SQUATTING --> IDLE: 动作完成
    IDLE --> ANALYZING: 收集足够帧
    ANALYZING --> COMPLETE: 达到目标次数
    ANALYZING --> IDLE: 继续训练

    COMPLETE --> CONFIG: 重新开始
    CONFIG --> [*]: 退出页面

    note right of SQUATTING
        实时姿态分析
        骨骼绘制
        关节角度计算
        运动质量评估
    end note

    note right of ANALYZING
        帧数据分析
        动作质量评分
        生成训练报告
    end note
```

## 数据库ER图

```mermaid
erDiagram
    PATIENTS {
        int id PK
        varchar name
        int age
        varchar gender
        float height
        float weight
        datetime created_at
        datetime updated_at
    }

    EXERCISE_REPORTS {
        int id PK
        int patient_id FK
        varchar exercise_type
        datetime session_start_time
        datetime session_end_time
        int total_attempts
        int valid_reps
        float success_rate
        float average_score
        text rep_details
        text summary_data
        text recommendations
        datetime created_at
    }

    EXERCISE_REP_DETAILS {
        int id PK
        int report_id FK
        int rep_number
        float score
        boolean is_valid
        datetime start_time
        datetime end_time
        int duration_ms
        text joint_angles
        text form_analysis
    }

    PATIENTS ||--o{ EXERCISE_REPORTS : "has"
    EXERCISE_REPORTS ||--o{ EXERCISE_REP_DETAILS : "contains"
```

## 技术架构图

```mermaid
graph TB
    subgraph "前端层 (React)"
        UI[用户界面]
        Components[React组件]
        StateManagement[状态管理]
        MediaPipeJS[MediaPipe JS]
    end

    subgraph "后端层 (Node.js)"
        ExpressAPI[Express API]
        DatabaseAPI[数据库API]
        FileHandling[文件处理]
    end

    subgraph "数据层"
        MySQL[(MySQL数据库)]
        FileStorage[文件存储]
    end

    subgraph "外部服务"
        MediaPipe[MediaPipe Library]
        Camera[摄像头硬件]
    end

    UI --> Components
    Components --> StateManagement
    Components --> MediaPipeJS

    MediaPipeJS --> Camera
    MediaPipeJS --> MediaPipe

    StateManagement --> ExpressAPI
    ExpressAPI --> DatabaseAPI
    ExpressAPI --> FileHandling

    DatabaseAPI --> MySQL
    FileHandling --> FileStorage
```

## 用户操作时序图

```mermaid
sequenceDiagram
    participant User as 用户
    participant Frontend as 前端
    participant Backend as 后端
    participant DB as 数据库
    participant Camera as 摄像头

    User->>Frontend: 进入深蹲训练页面
    Frontend->>Backend: 获取运动标准
    Backend->>DB: 查询运动参数
    DB-->>Backend: 返回标准数据
    Backend-->>Frontend: 返回运动标准

    User->>Frontend: 选择用户
    Frontend->>Backend: 获取用户列表
    Backend->>DB: 查询用户信息
    DB-->>Backend: 返回用户数据
    Backend-->>Frontend: 返回用户列表

    User->>Frontend: 设置目标次数
    User->>Frontend: 开始训练
    Frontend->>Camera: 启动摄像头
    Frontend->>Frontend: 初始化MediaPipe

    loop 训练过程
        Camera->>Frontend: 捕获视频帧
        Frontend->>Frontend: MediaPipe姿态检测
        Frontend->>Frontend: 实时分析关节角度
        Frontend->>Frontend: 绘制彩色骨骼
        Frontend->>User: 显示实时反馈
    end

    User->>Frontend: 完成训练
    Frontend->>Frontend: 生成训练报告
    Frontend->>Backend: 保存报告数据
    Backend->>DB: 存储exercise_reports
    Backend->>DB: 存储exercise_rep_details
    DB-->>Backend: 返回保存结果
    Backend-->>Frontend: 返回报告ID
    Frontend->>User: 显示训练完成
```

## 关键特性说明

### 1. 彩色骨骼绘制系统
- 🔴 **头部连接**: 红色系 (#dc2626, #ef4444)
- 🟣 **躯干连接**: 紫色系 (#9333ea, #a855f7)
- 🟠 **上肢连接**: 橙色系 (#ea580c, #fb923c)
- 🟢 **下肢连接**: 绿色系 (#16a34a, #4ade80)

### 2. 实时姿态分析
- 33个MediaPipe关键点检测
- 实时关节角度计算
- 运动质量实时评分
- 渐变色彩视觉效果

### 3. 智能状态管理
- useReducer状态机控制训练流程
- 会话数据实时追踪
- 错误状态处理和恢复

### 4. 数据持久化
- MySQL数据库存储用户信息
- 训练报告详细记录
- 支持历史数据查询和导出

这个系统提供了完整的运动训练分析解决方案，从用户选择到实时分析，再到报告生成和数据存储的全流程覆盖。