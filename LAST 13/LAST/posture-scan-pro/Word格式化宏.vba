Sub 应用PostureScan文档格式()
'
' 应用PostureScan Pro文档格式规范
' 快捷键: 可自定义
'
    Application.ScreenUpdating = False
    
    ' ========== 1. 页面设置 ==========
    With ActiveDocument.PageSetup
        .PaperSize = wdPaperA4
        .TopMargin = CentimetersToPoints(2.5)
        .BottomMargin = CentimetersToPoints(2.5)
        .LeftMargin = CentimetersToPoints(3)
        .RightMargin = CentimetersToPoints(2)
    End With
    
    ' ========== 2. 页眉设置 ==========
    If ActiveDocument.Sections(1).Headers(wdHeaderFooterPrimary).Exists Then
        With ActiveDocument.Sections(1).Headers(wdHeaderFooterPrimary)
            .Range.Text = ""
            .Range.Font.Name = "宋体"
            .Range.Font.Size = 9
            
            ' 左侧：文档名称
            .Range.InsertBefore "PostureScan Pro 平台系统架构文档"
            
            ' 右侧：版本号
            .Range.Paragraphs(1).Alignment = wdAlignParagraphLeft
            .Range.InsertAfter vbTab & vbTab & vbTab & "V2.1.1"
        End With
    End If
    
    ' ========== 3. 页脚设置（页码）==========
    If ActiveDocument.Sections(1).Footers(wdHeaderFooterPrimary).Exists Then
        With ActiveDocument.Sections(1).Footers(wdHeaderFooterPrimary)
            .Range.Text = ""
            .PageNumbers.Add PageNumberAlignment:=wdAlignPageNumberCenter
            .Range.Font.Name = "宋体"
            .Range.Font.Size = 10
            ' 设置页码格式为 "第 X 页 共 Y 页"
            .Range.Fields.Add Range:=.Range, Type:=wdFieldEmpty, Text:= _
                "第 PAGE  页 共 NUMPAGES  页", PreserveFormatting:=False
        End With
    End If
    
    ' ========== 4. 设置标题样式 ==========
    ' 一级标题：二号、加粗、宋体、单倍行距
    With ActiveDocument.Styles(wdStyleHeading1).Font
        .NameFarEast = "宋体"
        .NameAscii = "Times New Roman"
        .Size = 22  ' 二号
        .Bold = True
    End With
    With ActiveDocument.Styles(wdStyleHeading1).ParagraphFormat
        .LineSpacingRule = wdLineSpaceSingle
        .SpaceBefore = 12
        .SpaceAfter = 6
    End With
    
    ' 二级标题：小三、加粗、宋体、单倍行距
    With ActiveDocument.Styles(wdStyleHeading2).Font
        .NameFarEast = "宋体"
        .NameAscii = "Times New Roman"
        .Size = 15  ' 小三
        .Bold = True
    End With
    With ActiveDocument.Styles(wdStyleHeading2).ParagraphFormat
        .LineSpacingRule = wdLineSpaceSingle
        .SpaceBefore = 10
        .SpaceAfter = 5
    End With
    
    ' 三级标题：四号、加粗、宋体、单倍行距
    With ActiveDocument.Styles(wdStyleHeading3).Font
        .NameFarEast = "宋体"
        .NameAscii = "Times New Roman"
        .Size = 14  ' 四号
        .Bold = True
    End With
    With ActiveDocument.Styles(wdStyleHeading3).ParagraphFormat
        .LineSpacingRule = wdLineSpaceSingle
        .SpaceBefore = 8
        .SpaceAfter = 4
    End With
    
    ' ========== 5. 设置正文样式 ==========
    With ActiveDocument.Styles(wdStyleNormal).Font
        .NameFarEast = "宋体"
        .NameAscii = "Times New Roman"
        .Size = 12  ' 小四
    End With
    With ActiveDocument.Styles(wdStyleNormal).ParagraphFormat
        .LineSpacingRule = wdLineSpaceAtLeast
        .LineSpacing = 18  ' 1.5倍行距
        .Alignment = wdAlignParagraphJustify
    End With
    
    ' ========== 6. 格式化表格 ==========
    Dim tbl As Table
    For Each tbl In ActiveDocument.Tables
        With tbl
            ' 应用表格样式
            .Style = "网格型"
            .ApplyStyleHeadingRows = True
            .ApplyStyleFirstColumn = False
            
            ' 表头格式
            With .Rows(1).Range
                .Font.Name = "宋体"
                .Font.Size = 12
                .Font.Bold = True
                .ParagraphFormat.Alignment = wdAlignParagraphCenter
                .Shading.BackgroundPatternColor = RGB(217, 226, 243)  ' 浅蓝色
            End With
            
            ' 表格内容格式
            With .Range
                .Font.Name = "宋体"
                .Font.Size = 12
                .ParagraphFormat.Alignment = wdAlignParagraphCenter
            End With
        End With
    Next tbl
    
    ' ========== 7. 更新目录 ==========
    Dim toc As TableOfContents
    For Each toc In ActiveDocument.TablesOfContents
        toc.Update
    Next toc
    
    ' ========== 8. 更新所有域 ==========
    ActiveDocument.Fields.Update
    
    Application.ScreenUpdating = True
    
    MsgBox "格式应用完成！" & vbCrLf & vbCrLf & _
           "已应用以下格式：" & vbCrLf & _
           "✓ A4纸张，页边距：上下2.5cm/左3cm/右2cm" & vbCrLf & _
           "✓ 页眉：文档名称 + 版本号" & vbCrLf & _
           "✓ 页脚：第X页 共Y页" & vbCrLf & _
           "✓ 标题：一级二号/二级小三/三级四号" & vbCrLf & _
           "✓ 正文：小四，1.5倍行距" & vbCrLf & _
           "✓ 表格：网格型，表头浅蓝底纹", vbInformation, "PostureScan格式化"
End Sub
