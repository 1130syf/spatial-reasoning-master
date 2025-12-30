# 姿态分析系统 7.0.3 交互流程图

## 主要交互流程图

```mermaid
graph TB
    Start[系统启动] --> Auth[用户身份识别]

    Auth --> ExpertCheck{专家模式?}
    ExpertCheck -->|是| ExpertFlow[专家交互流程]
    ExpertCheck -->|否| UserFlow[用户交互流程]

    %% 专家交互流程
    ExpertFlow --> ExpertSelect[人员选择 - 专家模式]
    ExpertSelect --> ExpertDB[(专家数据库)]
    ExpertDB --> ExpertHistory[加载历史评估记录]

    ExpertHistory --> ExpertCapture[姿态采集 - 专家模式]
    ExpertCapture --> ExpertMP[MediaPipe 30-60fps<br/>33关键点检测]
    ExpertMP --> ExpertOverlay[骨架叠加显示<br/>🔴头部 🟣躯干 🟠上肢 🟢下肢]

    ExpertOverlay --> ExpertQC[质量检查 - 专家模式]
    ExpertQC --> ExpertConfidence{置信度 ≥0.5?}
    ExpertConfidence -->|是| ExpertAnalysis[分析处理 - 专家模式]
    ExpertConfidence -->|否| ExpertGuide[专家指导提示]

    ExpertGuide --> ExpertCapture
    ExpertAnalysis --> Expert3D[3D向量点积算法<br/>多平面角度计算]
    Expert3D --> ExpertBalance[平衡指数评估]
    ExpertBalance --> ExpertReport[偏差报告生成]

    ExpertReport --> ExpertDisplay[结果展示 - 专家模式]
    ExpertDisplay --> ExpertUI[专家界面]
    ExpertUI --> ExpertScore[综合评分仪表盘]
    ExpertUI --> ExpertAngles[详细角度数据]
    ExpertUI --> ExpertStatus[状态标签]
    ExpertUI --> ExpertCharts[可视化图表]
    ExpertUI --> ExpertCompare[历史对比分析]

    ExpertUI --> ExpertSuggest[建议反馈 - 专家模式]
    ExpertSuggest --> ExpertAdvice[专业改善建议]
    ExpertAdvice --> ExpertStorage[报告存储 - 专家模式]

    %% 用户交互流程
    UserFlow --> UserSelect[人员选择 - 用户模式]
    UserSelect --> UserDB[(用户数据库)]
    UserDB --> UserData[个人档案加载]

    UserData --> UserCapture[姿态采集 - 用户模式]
    UserCapture --> UserMP[MediaPipe 30-60fps<br/>33关键点检测]
    UserMP --> UserOverlay[骨架叠加显示<br/>🔴头部 🟣躯干 🟠上肢 🟢下肢]

    UserOverlay --> UserQC[质量检查 - 用户模式]
    UserQC --> UserConfidence{置信度 ≥0.5?}
    UserConfidence -->|是| UserAnalysis[分析处理 - 用户模式]
    UserConfidence -->|否| UserGuide[用户指导提示]

    UserGuide --> UserCapture
    UserAnalysis --> User3D[3D向量点积算法<br/>简化角度计算]
    User3D --> UserBalance[平衡指数评估]
    UserBalance --> UserReport[基础偏差报告]

    UserReport --> UserDisplay[结果展示 - 用户模式]
    UserDisplay --> UserUI[用户界面]
    UserUI --> UserScore[简化评分显示]
    UserUI --> UserBasic[基础反馈信息]
    UserUI --> UserProgress[进度追踪图表]

    UserUI --> UserSuggest[建议反馈 - 用户模式]
    UserSuggest --> UserAdvice[基础训练建议]
    UserAdvice --> UserStorage[报告存储 - 用户模式]

    %% 数据存储
    ExpertStorage --> MySQL[(MySQL数据库)]
    UserStorage --> MySQL

    MySQL --> JSON[JSON结构持久化]
    JSON --> History[历史回溯]
    JSON --> Compare[对比分析]

    %% 循环流程
    History --> Continue{继续评估?}
    Continue -->|是| ExpertSelect
    Continue -->|否| End[结束会话]

%% 样式定义
classDef expertMode fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
classDef userMode fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
classDef coreEngine fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
classDef dataLayer fill:#fff3e0,stroke:#f57c00,stroke-width:2px
classDef decision fill:#ffebee,stroke:#d32f2f,stroke-width:2px

class ExpertFlow,ExpertSelect,ExpertCapture,ExpertQC,ExpertAnalysis,ExpertDisplay,ExpertSuggest,ExpertStorage expertMode
class UserFlow,UserSelect,UserCapture,UserQC,UserAnalysis,UserDisplay,UserSuggest,UserStorage userMode
class ExpertMP,Expert3D,ExpertBalance,UserMP,User3D,UserBalance coreEngine
class ExpertDB,UserDB,MySQL,JSON,History,Compare dataLayer
class ExpertConfidence,UserConfidence,Continue decision
```

## 详细子流程图

### 1. 人员选择子流程

```mermaid
graph LR
    StartSelect[开始人员选择] --> ModeCheck{模式检查}

    ModeCheck -->|专家模式| ExpertMgmt[专家人员管理]
    ModeCheck -->|用户模式| UserProfile[用户个人档案]

    ExpertMgmt --> ExpertOptions[专家选项]
    ExpertOptions --> CreateNew[新建评估对象]
    ExpertOptions --> SelectExist[选择现有人员]
    ExpertOptions --> ImportBatch[批量导入]
    ExpertOptions --> ViewHistory[查看历史记录]

    CreateNew --> ExpertForm[详细信息表单]
    SelectExist --> ExpertList[人员列表管理]
    ImportBatch --> BatchUpload[批量上传接口]
    ViewHistory --> HistoryTable[历史记录表格]

    UserProfile --> UserOptions[用户选项]
    UserOptions --> UpdateInfo[更新基本信息]
    UserOptions --> ViewProgress[查看训练进度]
    UserOptions --> SetGoals[设置训练目标]

    ExpertForm --> ValidateData[数据验证]
    ExpertList --> LoadHistory[加载历史记录]
    BatchUpload --> DataParse[数据解析]
    HistoryTable --> CompareData[数据对比]

    ValidateData --> ExpertDB[(专家数据库)]
    LoadHistory --> ExpertDB
    DataParse --> ExpertDB
    CompareData --> ExpertDB

    UpdateInfo --> UserDB[(用户数据库)]
    ViewProgress --> UserDB
    SetGoals --> UserDB

    ExpertDB --> ExpertLoad[专家数据加载]
    UserDB --> UserLoad[用户数据加载]

    ExpertLoad --> ExpertComplete[专家选择完成]
    UserLoad --> UserComplete[用户选择完成]

    ExpertComplete --> NextStep[进入姿态采集]
    UserComplete --> NextStep
```

### 2. 姿态采集与质量检查子流程

```mermaid
graph TD
    InitCapture[初始化姿态采集] --> CameraStart[启动摄像头]
    CameraStart --> MediaPipeInit[MediaPipe引擎初始化]
    MediaPipeInit --> ConfigParams[配置参数]

    ConfigParams --> ModelComplexity[模型复杂度: 2]
    ConfigParams --> SmoothLandmarks[平滑关键点: true]
    ConfigParams --> MinConfidence[最小置信度: 0.5]
    ConfigParams --> TargetFPS[目标帧率: 30-60]

    ModelComplexity --> StartDetection[开始实时检测]
    SmoothLandmarks --> StartDetection
    MinConfidence --> StartDetection
    TargetFPS --> StartDetection

    StartDetection --> LandmarkDetect[33关键点检测]
    LandmarkDetect --> SkeletonDraw[骨架绘制]

    SkeletonDraw --> ColorCode[颜色编码绘制]
    ColorCode --> HeadRed[🔴头部: 红色系]
    ColorCode --> TorsoPurple[🟣躯干: 紫色系]
    ColorCode --> ArmsOrange[🟠上肢: 橙色系]
    ColorCode --> LegsGreen[🟢下肢: 绿色系]

    SkeletonDraw --> QualityCheck[质量检查模块]
    QualityCheck --> ConfidenceCalc[置信度计算]

    ConfidenceCalc --> CheckThreshold{置信度 ≥ 0.5?}
    CheckThreshold -->|是| GoodQuality[检测质量良好]
    CheckThreshold -->|否| LowQuality[检测质量不足]

    LowQuality --> AnalyzeIssue[问题分析]
    AnalyzeIssue --> CheckLighting{光线问题?}
    AnalyzeIssue --> CheckOcclusion{遮挡问题?}
    AnalyzeIssue --> CheckPose{姿态问题?}

    CheckLighting -->|是| LightFeedback[请改善光线条件]
    CheckOcclusion -->|是| OccludeFeedback[请避免身体遮挡]
    CheckPose -->|是| PoseFeedback[请调整拍摄角度]

    LightFeedback --> AdjustGuide[调整指导]
    OccludeFeedback --> AdjustGuide
    PoseFeedback --> AdjustGuide

    AdjustGuide --> Recheck[重新检测]
    Recheck --> LandmarkDetect

    GoodQuality --> ContinueAnalysis[进入分析处理]

    classDef process fill:#e8f5e8,stroke:#4caf50
    classDef check fill:#fff3e0,stroke:#ff9800
    classDef feedback fill:#ffebee,stroke:#f44336
    classDef success fill:#e3f2fd,stroke:#2196f3

    class StartDetection,LandmarkDetect,SkeletonDraw,GoodQuality,ContinueAnalysis success
    class QualityCheck,ConfidenceCalc,CheckThreshold,CheckLighting,CheckOcclusion,CheckPose check
    class LowQuality,AnalyzeIssue,LightFeedback,OccludeFeedback,PoseFeedback,AdjustGuide feedback
    class CameraStart,MediaPipeInit,ConfigParams,ModelComplexity,SmoothLandmarks,MinConfidence,TargetFPS,Recheck process
```

### 3. 分析处理引擎子流程

```mermaid
graph TB
    StartAnalysis[开始分析处理] --> InputData[输入姿态数据]

    InputData --> ValidateLandmarks[验证关键点数据]
    ValidateLandmarks --> CheckComplete{33个关键点完整?}
    CheckComplete -->|否| DataError[数据错误提示]
    CheckComplete -->|是| CalculateAngles[计算关节角度]

    CalculateAngles --> Vector3D[3D向量计算]
    Vector3D --> DotProduct[点积算法]
    DotProduct --> AngleResult[角度结果]

    AngleResult --> MultiPlane[多平面分析]
    MultiPlane --> SagittalPlane[矢状面分析]
    MultiPlane --> CoronalPlane[额状面分析]
    MultiPlane --> TransversePlane[横断面分析]

    SagittalPlane --> KneeAngles[膝关节角度]
    SagittalPlane --> HipAngles[髋关节角度]
    SagittalPlane --> SpinalAngles[脊柱角度]

    CoronalPlane --> ShoulderBalance[肩膀平衡]
    CoronalPlane --> PelvicBalance[骨盆平衡]
    CoronalPlane --> TrunkAlignment[躯干对齐]

    TransversePlane --> RotationAngles[旋转角度]

    KneeAngles --> BalanceIndex[平衡指数计算]
    HipAngles --> BalanceIndex
    ShoulderBalance --> BalanceIndex
    PelvicBalance --> BalanceIndex

    BalanceIndex --> SymmetryScore[对称性评分]
    BalanceIndex --> StabilityScore[稳定性评分]
    BalanceIndex --> ConformityScore[标准符合度评分]

    SymmetryScore --> OverallScore[综合评分]
    StabilityScore --> OverallScore
    ConformityScore --> OverallScore

    OverallScore --> DeviationReport[偏差报告生成]
    DeviationReport --> AnalysisResult[分析结果输出]

    DataError --> ErrorHandling[错误处理]
    ErrorHandling --> UserNotify[用户通知]
    UserNotify --> RestartDetection[重新开始检测]
    RestartDetection --> ValidateLandmarks

    classDef calculation fill:#e3f2fd,stroke:#2196f3
    classDef analysis fill:#e8f5e8,stroke:#4caf50
    classDef scoring fill:#fff3e0,stroke:#ff9800
    classDef output fill:#f3e5f5,stroke:#9c27b0
    classDef error fill:#ffebee,stroke:#f44336

    class Vector3D,DotProduct,AngleResult calculation
    class SagittalPlane,CoronalPlane,TransversePlane,KneeAngles,HipAngles,ShoulderBalance,PelvicBalance analysis
    class BalanceIndex,SymmetryScore,StabilityScore,ConformityScore,OverallScore scoring
    class DeviationReport,AnalysisResult output
    class DataError,ErrorHandling,UserNotify,RestartDetection error
```

### 4. 结果展示与反馈子流程

```mermaid
graph TD
    StartDisplay[开始结果展示] --> ModeSelect{显示模式选择}

    ModeSelect -->|专家模式| ExpertDisplayPanel[专家显示面板]
    ModeSelect -->|用户模式| UserDisplayPanel[用户显示面板]

    %% 专家显示面板
    ExpertDisplayPanel --> ScoreDashboard[评分仪表盘]
    ScoreDashboard --> OverallGauge[总分仪表]
    ScoreDashboard --> CategoryScores[分项评分]

    ExpertDisplayPanel --> AngleDetails[角度详情面板]
    AngleDetails --> SagittalAngles[矢状面角度数据]
    AngleDetails --> CoronalAngles[额状面角度数据]
    AngleDetails --> AngleCharts[角度变化图表]

    ExpertDisplayPanel --> StatusPanel[状态标签面板]
    StatusPanel --> QualityStatus[质量状态标签]
    StatusPanel --> DeviationTags[偏差标记]
    StatusPanel --> ImprovementMarkers[改善标记]

    ExpertDisplayPanel --> VisualPanel[可视化面板]
    VisualPanel --> SkeletonHeatmap[骨架热力图]
    VisualPanel --> TrajectoryChart[运动轨迹图]
    VisualPanel --> ComparisonChart[历史对比图]

    ExpertDisplayPanel --> ExpertTools[专家工具]
    ExpertTools --> ParameterAdjust[参数调整]
    ExpertTools --> DataExport[数据导出]
    ExpertTools --> ReportTemplate[报告模板]

    %% 用户显示面板
    UserDisplayPanel --> SimpleScore[简化评分显示]
    SimpleScore --> StarRating[星级评分]
    SimpleScore --> ProgressArc[进度弧线]
    SimpleScore --> AchievementBadge[成就徽章]

    UserDisplayPanel --> BasicFeedback[基础反馈信息]
    BasicFeedback --> MainIssues[主要问题]
    BasicFeedback --> ProgressTips[进步提示]
    BasicFeedback --> EncouragementMsg[鼓励消息]

    UserDisplayPanel --> ProgressPanel[进度面板]
    ProgressPanel --> HistoryProgress[历史进度]
    ProgressPanel --> TrendChart[趋势图表]
    ProgressPanel --> GoalTracking[目标跟踪]

    %% 建议反馈生成
    ExpertTools --> SuggestionEngine[建议生成引擎]
    ProgressPanel --> SuggestionEngine

    SuggestionEngine --> ExpertSuggestions[专家建议系统]
    SuggestionEngine --> UserSuggestions[用户建议系统]

    ExpertSuggestions --> ProfessionalAdvice[专业改善方案]
    ExpertSuggestions --> TechnicalAnalysis[技术分析报告]
    ExpertSuggestions --> TrainingPlan[训练计划制定]

    UserSuggestions --> SimpleAdvice[简单指导建议]
    UserSuggestions --> MotivationTips[激励提示]
    UserSuggestions --> NextSteps[下一步行动]

    ProfessionalAdvice --> FeedbackDisplay[反馈显示]
    TechnicalAnalysis --> FeedbackDisplay
    TrainingPlan --> FeedbackDisplay

    SimpleAdvice --> FeedbackDisplay
    MotivationTips --> FeedbackDisplay
    NextSteps --> FeedbackDisplay

    classDef expertPanel fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef userPanel fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef engine fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef display fill:#fff3e0,stroke:#f57c00,stroke-width:2px

    class ExpertDisplayPanel,ScoreDashboard,AngleDetails,StatusPanel,VisualPanel,ExpertTools expertPanel
    class UserDisplayPanel,SimpleScore,BasicFeedback,ProgressPanel userPanel
    class SuggestionEngine,ExpertSuggestions,UserSuggestions engine
    class FeedbackDisplay,ProfessionalAdvice,TechnicalAnalysis,TrainingPlan,SimpleAdvice,MotivationTips,NextSteps display
```

### 5. 数据存储与历史管理子流程

```mermaid
graph TD
    StartStorage[开始数据存储] --> DataFormat[数据格式化]

    DataFormat --> SessionInfo[会话信息封装]
    DataFormat --> SubjectInfo[被试信息封装]
    DataFormat --> AnalysisInfo[分析结果封装]
    DataFormat --> FeedbackInfo[反馈信息封装]

    SessionInfo --> Timestamp[时间戳]
    SessionInfo --> Duration[持续时间]
    SessionInfo --> FPS[帧率信息]
    SessionInfo --> Confidence[平均置信度]

    SubjectInfo --> SubjectID[被试ID]
    SubjectInfo --> PersonalData[个人数据]
    SubjectInfo --> UserType[用户类型]

    AnalysisInfo --> ScoreData[评分数据]
    AnalysisInfo --> AngleData[角度数据]
    AnalysisInfo --> BalanceData[平衡数据]
    AnalysisInfo --> FrameData[帧数据]

    FeedbackInfo --> ExpertFeedback[专家反馈]
    FeedbackInfo --> UserFeedback[用户反馈]
    FeedbackInfo --> Recommendations[改善建议]

    %% JSON结构生成
    SessionInfo --> JSONStructure[JSON数据结构]
    SubjectInfo --> JSONStructure
    AnalysisInfo --> JSONStructure
    FeedbackInfo --> JSONStructure

    JSONStructure --> ValidateJSON[JSON验证]
    ValidateJSON --> Compression[数据压缩]
    Compression --> DatabaseStore[数据库存储]

    %% MySQL存储流程
    DatabaseStore --> SessionTable[会话表存储]
    DatabaseStore --> FrameTable[帧数据表存储]
    DatabaseStore --> SubjectTable[被试表更新]

    SessionTable --> SessionSQL[INSERT INTO assessment_sessions]
    FrameTable --> FrameSQL[INSERT INTO analysis_frames]
    SubjectTable --> SubjectSQL[UPDATE subjects]

    SessionSQL --> StorageComplete[存储完成]
    FrameSQL --> StorageComplete
    SubjectSQL --> StorageComplete

    %% 历史数据管理
    StorageComplete --> HistoryIndex[历史索引更新]
    HistoryIndex --> ComparisonData[对比数据生成]
    ComparisonData --> TrendAnalysis[趋势分析]

    TrendAnalysis --> ProgressReport[进度报告]
    TrendAnalysis --> ComparisonReport[对比报告]
    TrendAnalysis --> StatisticsReport[统计报告]

    %% 数据检索功能
    SessionTable --> QueryEngine[查询引擎]
    FrameTable --> QueryEngine
    SubjectTable --> QueryEngine

    QueryEngine --> HistoryQuery[历史查询]
    QueryEngine --> CompareQuery[对比查询]
    QueryEngine --> StatisticsQuery[统计查询]

    HistoryQuery --> HistoryDisplay[历史展示]
    CompareQuery --> CompareDisplay[对比展示]
    StatisticsQuery --> StatisticsDisplay[统计展示]

    classDef dataFormat fill:#e3f2fd,stroke:#2196f3
    classDef jsonProcess fill:#e8f5e8,stroke:#4caf50
    classDef database fill:#fff3e0,stroke:#ff9800
    classDef history fill:#f3e5f5,stroke:#9c27b0
    classDef query fill:#ffebee,stroke:#f44336

    class SessionInfo,SubjectInfo,AnalysisInfo,FeedbackInfo dataFormat
    class JSONStructure,ValidateJSON,Compression jsonProcess
    class DatabaseStore,SessionTable,FrameTable,SubjectTable database
    class HistoryIndex,ComparisonData,TrendAnalysis,ProgressReport,ComparisonReport,StatisticsReport history
    class QueryEngine,HistoryQuery,CompareQuery,StatisticsQuery query
```

## 系统整体架构图

```mermaid
graph TB
    subgraph "用户界面层"
        WebUI[Web用户界面]
        ExpertUI[专家界面]
        UserUI[用户界面]
    end

    subgraph "应用逻辑层"
        AuthService[认证服务]
        PersonService[人员管理服务]
        CaptureService[采集服务]
        AnalysisService[分析服务]
        DisplayService[展示服务]
        StorageService[存储服务]
    end

    subgraph "核心引擎层"
        MediaPipeEngine[MediaPipe引擎]
        AngleEngine[角度计算引擎]
        BalanceEngine[平衡评估引擎]
        SuggestionEngine[建议生成引擎]
        RenderEngine[渲染引擎]
    end

    subgraph "数据访问层"
        APIService[API服务]
        ValidationService[验证服务]
        CacheService[缓存服务]
    end

    subgraph "数据存储层"
        MySQLDB[(MySQL数据库)]
        FileStorage[文件存储]
        CacheLayer[(缓存层)]
    end

    subgraph "外部服务"
        CameraService[摄像头服务]
        MediaPipeAPI[MediaPipe API]
        CloudStorage[云存储]
    end

    %% 连接关系
    WebUI --> AuthService
    ExpertUI --> PersonService
    UserUI --> PersonService

    AuthService --> APIService
    PersonService --> APIService
    CaptureService --> MediaPipeEngine
    AnalysisService --> AngleEngine
    DisplayService --> RenderEngine
    StorageService --> ValidationService

    MediaPipeEngine --> MediaPipeAPI
    AngleEngine --> BalanceEngine
    BalanceEngine --> SuggestionEngine
    RenderEngine --> DisplayService

    APIService --> MySQLDB
    ValidationService --> MySQLDB
    CacheService --> CacheLayer

    CaptureService --> CameraService
    StorageService --> FileStorage
    StorageService --> CloudStorage

    %% 样式定义
    classDef ui fill:#e8f5e8,stroke:#4caf50
    classDef logic fill:#e3f2fd,stroke:#2196f3
    classDef engine fill:#fff3e0,stroke:#ff9800
    classDef data fill:#f3e5f5,stroke:#9c27b0
    classDef external fill:#ffebee,stroke:#f44336

    class WebUI,ExpertUI,UserUI ui
    class AuthService,PersonService,CaptureService,AnalysisService,DisplayService,StorageService logic
    class MediaPipeEngine,AngleEngine,BalanceEngine,SuggestionEngine,RenderEngine engine
    class APIService,ValidationService,CacheService,MySQLDB,FileStorage,CacheLayer data
    class CameraService,MediaPipeAPI,CloudStorage external
```

这些详细的流程图完整展示了姿态分析系统7.0.3版本的交互流程，涵盖了从人员选择到数据存储的完整链路，并体现了"专家-系统"与"用户-系统"的双重交互机制。