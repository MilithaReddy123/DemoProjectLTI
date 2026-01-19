import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  loading = false;
  
  // Pie chart
  stateChartData: ChartData = { labels: [], datasets: [] };
  
  // Bar charts
  hobbiesChartData: ChartData = { labels: [], datasets: [] };
  techInterestsChartData: ChartData = { labels: [], datasets: [] };


  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      // Legend becomes vertical when positioned left/right
      legend: {
        position: 'right' as const,
        align: 'start' as const,
        labels: {
          padding: 10,
          usePointStyle: true,
          boxWidth: 10,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
          autoSkip: true,
        },
        grid: {
          display: true
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Color palettes
  private pieColors = [
    '#4F81BD', '#9BBB59', '#C0504D', '#8064A2', '#4BACC6',
    '#F79646', '#2E75B6', '#70AD47', '#FFC000', '#4472C4',
    '#ED7D31', '#A5A5A5', '#FF0000', '#00B050', '#7030A0'
  ];

  private barColors = [
    'rgba(79, 129, 189, 0.85)',
    'rgba(155, 187, 89, 0.85)',
    'rgba(192, 80, 77, 0.85)',
    'rgba(128, 100, 162, 0.85)',
    'rgba(75, 172, 198, 0.85)',
    'rgba(247, 150, 70, 0.85)'
  ];

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllCharts();
  }

  loadAllCharts(): void {
    this.loading = true;
    Promise.all([
      this.loadStateChart(),
      this.loadHobbiesChart(),
      this.loadTechInterestsChart()
    ]).finally(() => {
      this.loading = false;
    });
  }
// loads data for the pie chart
  private loadStateChart(): void {
    this.userService.getStateDistribution().subscribe({
      next: (data) => {
        const bgColors = this.pieColors.slice(0, data.length);
        this.stateChartData = {
          labels: data.map(d => d.label),
          datasets: [{
            label: 'Users by States',
            data: data.map(d => d.value),
            backgroundColor: bgColors,
            borderColor: bgColors.map(() => '#fff'),
            borderWidth: 2
          }]
        };
      },
      error: () => this.toast('error', 'Error', 'Failed to load state distribution')
    });
  }


  private loadHobbiesChart(): void {
    this.userService.getHobbiesDistribution().subscribe({
      next: (data) => {
        const colors = data.map((_, i) => this.barColors[i % this.barColors.length]);
        this.hobbiesChartData = {
          labels: data.map(d => d.label),
          datasets: [{
            label: 'Users',
            data: data.map(d => d.value),
            backgroundColor: colors,
            borderColor: colors.map(c => c.replace('0.8', '1')),
            borderWidth: 1
          }]
        };
      },
      error: () => this.toast('error', 'Error', 'Failed to load hobbies distribution')
    });
  }

  private loadTechInterestsChart(): void {
    this.userService.getTechInterestsDistribution().subscribe({
      next: (data) => {
        const colors = data.map((_, i) => this.barColors[(i + 1) % this.barColors.length]);
        this.techInterestsChartData = {
          labels: data.map(d => d.label),
          datasets: [{
            label: 'Users',
            data: data.map(d => d.value),
            backgroundColor: colors,
            borderColor: colors.map(c => c.replace('0.8', '1')),
            borderWidth: 1
          }]
        };
      },
      error: () => this.toast('error', 'Error', 'Failed to load tech interests distribution')
    });
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  private toast(severity: string, summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 3000 });
  }
}
