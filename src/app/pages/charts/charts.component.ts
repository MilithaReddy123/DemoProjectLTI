import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css']
})
export class ChartsComponent implements OnInit {
  stateChartOption: EChartsOption = {};
  hobbiesChartOption: EChartsOption = {};
  techInterestsChartOption: EChartsOption = {};

  private colors = [
    '#2563eb',      // Rich blue
    '#60a5fa',      // Soft blue
    '#059669',      // Emerald green
    '#34d399',      // Light emerald
    '#d97706',      // Warm amber
    '#fbbf24',      // Golden yellow
    '#dc2626',      // Deep red
    '#f87171',      // Coral red
    '#7c3aed',      // Deep purple
    '#a78bfa',      // Lavender
    '#0891b2',      // Ocean blue
    '#22d3ee',      // Sky blue
    '#db2777',      // Rose pink
    '#f472b6',      // Soft pink
    '#0d9488',      // Teal
    '#2dd4bf',      // Mint
    '#ea580c',      // Burnt orange
    '#fb923c',      // Peach
    '#4f46e5',      // Indigo
    '#818cf8'       // Periwinkle
  ];
  private tooltipConfig = {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderWidth: 1,
    borderRadius: 8,
    textStyle: { color: '#f1f5f9', fontSize: 12, fontWeight: 500 },
    padding: [10, 14]
  };

  constructor(
    private userService: UserService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    forkJoin({
      states: this.userService.getStateDistribution(),
      hobbies: this.userService.getHobbiesDistribution(),
      techInterests: this.userService.getTechInterestsDistribution()
    }).subscribe({
      next: (data) => {
        this.stateChartOption = this.buildPieChart(data.states);
        this.hobbiesChartOption = this.buildBarChart(data.hobbies);
        this.techInterestsChartOption = this.buildBarChart(data.techInterests, 1);
      },
      error: () => this.toastService.show('error', 'Error', 'Failed to load chart data')
    });
  }

  private buildPieChart(data: { label: string; value: number }[]): EChartsOption {
    return {
      tooltip: { ...this.tooltipConfig, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: {
        orient: 'vertical',
        right: 8,
        top: 'middle',
        itemGap: 14,
        textStyle: { fontSize: 12, color: '#475569', fontWeight: 500 },
        formatter: (name: string) => {
          const item = data.find(d => d.label === name);
          return `${name}: ${item?.value || 0}`;
        }
      },
      series: [{
        name: 'Users by States',
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#ffffff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, fontWeight: 500, color: '#334155' },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 600 },
          itemStyle: { shadowBlur: 8, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.2)' }
        },
        animationType: 'scale',
        animationEasing: 'cubicOut',
        animationDelay: (idx: number) => idx * 50,
        data: data.map((d, i) => ({
          value: d.value,
          name: d.label,
          itemStyle: { color: this.colors[i % this.colors.length] }
        }))
      }]
    };
  }

  private buildBarChart(data: { label: string; value: number }[], colorOffset = 0): EChartsOption {
    return {
      tooltip: {
        ...this.tooltipConfig,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const param = Array.isArray(params) ? params[0] : params;
          return `${param.name}<br/><strong style="font-weight: 600;">${param.seriesName}: ${param.value}</strong>`;
        }
      },
      grid: { left: '12%', right: '6%', bottom: '16%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(d => d.label),
        axisLabel: {
          rotate: data.some(d => d.label.length > 10) ? 45 : 0,
          fontSize: 11,
          color: '#64748b',
          fontWeight: 500
        },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'Users',
        nameTextStyle: { color: '#64748b', fontSize: 12, fontWeight: 600, padding: [0, 0, 0, 8] },
        axisLabel: { fontSize: 11, color: '#64748b', fontWeight: 500 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'solid', width: 1 } }
      },
      series: [{
        name: 'Users',
        type: 'bar',
        data: data.map((d, i) => ({
          value: d.value,
          itemStyle: {
            color: this.colors[(i + colorOffset) % this.colors.length],
            borderRadius: [4, 4, 0, 0]
          }
        })),
        barWidth: '60%',
        label: { show: true, position: 'top', fontSize: 11, color: '#334155', fontWeight: 600 },
        emphasis: {
          itemStyle: { shadowBlur: 6, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.15)' }
        },
        animationDelay: (idx: number) => idx * 50
      }],
      animationEasing: 'cubicOut'
    };
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }
}
