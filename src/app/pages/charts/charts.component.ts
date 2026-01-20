import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UserService } from '../../services/user.service';
import { MessageService } from 'primeng/api';

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css']
})
export class ChartsComponent implements OnInit {
  stateChartData: ChartData = { labels: [], datasets: [] };
  hobbiesChartData: ChartData = { labels: [], datasets: [] };
  techInterestsChartData: ChartData = { labels: [], datasets: [] };

  pieColors = ['#4F81BD', '#9BBB59', '#C0504D', '#8064A2', '#4BACC6', '#F79646', '#2E75B6'];
  barColors = ['rgba(79, 129, 189, 0.85)', 'rgba(155, 187, 89, 0.85)', 'rgba(192, 80, 77, 0.85)', 'rgba(128, 100, 162, 0.85)', 'rgba(75, 172, 198, 0.85)', 'rgba(247, 150, 70, 0.85)'];

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    // extra room so outside labels don't clip, but keep them inside card
    layout: { padding: { left: 32, right: 90, top: 24, bottom: 24 } },
    plugins: {
      // reference-style: names around the pie with connector lines (drawn by custom plugin in main.ts)
      pieOutLabels: { lineLength: 18, elbowLength: 22, fontSize: 11, lineWidth: 2, color: '#444', maxChars: 16, radiusFactor: 0.85 },
      // legend shows which color maps to which state (vertical on the right)
      legend: {
        display: true,
        position: 'right' as const,
        labels: { usePointStyle: true, boxWidth: 10, padding: 12, font: { size: 12 } }
      },
      tooltip: { enabled: true }
    }
  };

  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed.y || 0}` } }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { display: true } },
      x: { grid: { display: false } }
    }
  };

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    forkJoin({
      states: this.userService.getStateDistribution(),
      hobbies: this.userService.getHobbiesDistribution(),
      techInterests: this.userService.getTechInterestsDistribution()
    }).subscribe({
      next: (data) => {
        this.stateChartData = this.buildPieChart(data.states, 'Users by States');
        this.hobbiesChartData = this.buildBarChart(data.hobbies);
        this.techInterestsChartData = this.buildBarChart(data.techInterests, 1);
      },
      error: () => this.toast('error', 'Error', 'Failed to load chart data')
    });
  }

  private buildPieChart(data: { label: string; value: number }[], label: string): ChartData {
    const colors = this.pieColors.slice(0, data.length);
    return {
      labels: data.map(d => d.label),
      datasets: [{
        label,
        data: data.map(d => d.value),
        backgroundColor: colors,
        borderColor: colors.map(() => '#fff'),
        borderWidth: 2
      }]
    };
  }

  private buildBarChart(data: { label: string; value: number }[], colorOffset = 0): ChartData {
    const colors = data.map((_, i) => this.barColors[(i + colorOffset) % this.barColors.length]);
    return {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'Users',
        data: data.map(d => d.value),
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.85', '1')),
        borderWidth: 1
      }]
    };
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  private toast(severity: string, summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 3000 });
  }
}
