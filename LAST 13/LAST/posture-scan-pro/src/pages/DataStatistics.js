/**
 * 数据展示模块 - 统计图表页面
 * 包含：年龄分布柱状图、性别分布饼图、评估趋势折线图、评估类型饼图
 */
import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import api from '../api';
import './DataStatistics.css';

// 注册 Chart.js 组件
Chart.register(...registerables);

const DataStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart refs
  const ageChartRef = useRef(null);
  const genderChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const typeChartRef = useRef(null);
  
  // Chart instances
  const ageChartInstance = useRef(null);
  const genderChartInstance = useRef(null);
  const trendChartInstance = useRef(null);
  const typeChartInstance = useRef(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        const data = await api.getStatistics();
        setStatistics(data);
        setError(null);
      } catch (err) {
        console.error('获取统计数据失败:', err);
        setError('无法加载统计数据，请确保后端服务已启动');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatistics();
  }, []);

  // 绘制图表
  useEffect(() => {
    if (!statistics) return;

    // 销毁旧图表
    if (ageChartInstance.current) ageChartInstance.current.destroy();
    if (genderChartInstance.current) genderChartInstance.current.destroy();
    if (trendChartInstance.current) trendChartInstance.current.destroy();
    if (typeChartInstance.current) typeChartInstance.current.destroy();

    // 1. 年龄分布柱状图
    if (ageChartRef.current && statistics.ageDistribution) {
      const ctx = ageChartRef.current.getContext('2d');
      ageChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: statistics.ageDistribution.map(d => d.ageGroup),
          datasets: [{
            label: '人数',
            data: statistics.ageDistribution.map(d => d.count),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(139, 92, 246, 0.8)'
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(16, 185, 129)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)',
              'rgb(139, 92, 246)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: true, text: '年龄分布', font: { size: 16 } }
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      });
    }

    // 2. 性别分布饼图
    if (genderChartRef.current && statistics.genderDistribution) {
      const ctx = genderChartRef.current.getContext('2d');
      const genderLabels = statistics.genderDistribution.map(d => 
        d.gender === 'male' ? '男性' : d.gender === 'female' ? '女性' : d.gender || '未知'
      );
      genderChartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: genderLabels,
          datasets: [{
            data: statistics.genderDistribution.map(d => d.count),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)',
              'rgba(156, 163, 175, 0.8)'
            ],
            borderColor: ['#fff', '#fff', '#fff'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: '性别分布', font: { size: 16 } },
            legend: { position: 'bottom' }
          }
        }
      });
    }

    // 3. 评估趋势折线图
    if (trendChartRef.current && statistics.monthlyTrend) {
      const ctx = trendChartRef.current.getContext('2d');
      trendChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: statistics.monthlyTrend.map(d => d.month),
          datasets: [{
            label: '评估数量',
            data: statistics.monthlyTrend.map(d => d.count),
            fill: true,
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: 'rgb(16, 185, 129)',
            tension: 0.4,
            pointBackgroundColor: 'rgb(16, 185, 129)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: '评估趋势（近12个月）', font: { size: 16 } },
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      });
    }

    // 4. 评估类型分布饼图
    if (typeChartRef.current && statistics.typeDistribution) {
      const ctx = typeChartRef.current.getContext('2d');
      typeChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: statistics.typeDistribution.map(d => d.type || '静态体态评估'),
          datasets: [{
            data: statistics.typeDistribution.map(d => d.count),
            backgroundColor: [
              'rgba(139, 92, 246, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: '评估类型分布', font: { size: 16 } },
            legend: { position: 'bottom' }
          }
        }
      });
    }

    // 清理函数
    return () => {
      if (ageChartInstance.current) ageChartInstance.current.destroy();
      if (genderChartInstance.current) genderChartInstance.current.destroy();
      if (trendChartInstance.current) trendChartInstance.current.destroy();
      if (typeChartInstance.current) typeChartInstance.current.destroy();
    };
  }, [statistics]);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>正在加载统计数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">
          <h2>⚠️ 加载失败</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container statistics-page">
      <div className="page-header">
        <h1>📊 数据展示</h1>
        <p className="subtitle">人员统计与评估分析概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{statistics?.totalPatients || 0}</span>
            <span className="stat-label">总人数</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-value">{statistics?.totalAssessments || 0}</span>
            <span className="stat-label">总评估数</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <span className="stat-value">
              {statistics?.balanceScores?.length > 0 
                ? Math.round(statistics.balanceScores.reduce((a, b) => a + b, 0) / statistics.balanceScores.length)
                : '--'}
            </span>
            <span className="stat-label">平均平衡指数</span>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="charts-grid">
        {/* 年龄分布柱状图 */}
        <div className="chart-card">
          <div className="chart-container">
            <canvas ref={ageChartRef}></canvas>
          </div>
        </div>

        {/* 性别分布饼图 */}
        <div className="chart-card">
          <div className="chart-container">
            <canvas ref={genderChartRef}></canvas>
          </div>
        </div>

        {/* 评估趋势折线图 */}
        <div className="chart-card wide">
          <div className="chart-container">
            <canvas ref={trendChartRef}></canvas>
          </div>
        </div>

        {/* 评估类型分布 */}
        <div className="chart-card">
          <div className="chart-container">
            <canvas ref={typeChartRef}></canvas>
          </div>
        </div>

        {/* 平衡指数分布 */}
        <div className="chart-card">
          <div className="balance-distribution">
            <h3>平衡指数分布</h3>
            <div className="balance-bars">
              {[
                { label: '优秀 (90-100)', min: 90, max: 100, color: '#10b981' },
                { label: '良好 (70-89)', min: 70, max: 89, color: '#3b82f6' },
                { label: '一般 (50-69)', min: 50, max: 69, color: '#f59e0b' },
                { label: '较差 (<50)', min: 0, max: 49, color: '#ef4444' }
              ].map(range => {
                const count = statistics?.balanceScores?.filter(
                  s => s >= range.min && s <= range.max
                ).length || 0;
                const total = statistics?.balanceScores?.length || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={range.label} className="balance-bar-item">
                    <div className="balance-bar-label">
                      <span>{range.label}</span>
                      <span>{count}人 ({percentage}%)</span>
                    </div>
                    <div className="balance-bar-track">
                      <div 
                        className="balance-bar-fill" 
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: range.color 
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataStatistics;
