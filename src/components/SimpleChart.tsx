import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

interface PieChartProps {
  data: Array<{
    name: string;
    population?: number;
    progress?: number;
    color: string;
  }>;
  width: number;
  height: number;
}

interface LineChartProps {
  data: Array<{
    day?: string;
    impact: number;
  }>;
  width: number;
  height: number;
}

interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  width: number;
  height: number;
}

export const SimplePieChart: React.FC<PieChartProps> = ({ data, width, height }) => {
  const radius = Math.min(width, height) * 0.35;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const total = data.reduce((sum, item) => sum + (item.population || item.progress || 0), 0);
  
  let currentAngle = 0;
  
  return (
    <View style={[styles.chartContainer, { width, height }]}>
      <Svg width={width} height={height}>
        {data.map((item, index) => {
          const value = item.population || item.progress || 0;
          const angle = (value / total) * 2 * Math.PI;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);
          
          const largeArcFlag = angle > Math.PI ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <Path
              key={index}
              d={pathData}
              fill={item.color}
              stroke="#ffffff"
              strokeWidth={2}
            />
          );
        })}
      </Svg>
    </View>
  );
};

export const SimpleLineChart: React.FC<LineChartProps> = ({ data, width, height }) => {
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  const maxValue = Math.max(...data.map(d => d.impact));
  const minValue = Math.min(...data.map(d => d.impact));
  
  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + (1 - (item.impact - minValue) / (maxValue - minValue)) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <View style={[styles.chartContainer, { width, height }]}>
      <Svg width={width} height={height}>
        <Path
          d={`M ${points}`}
          fill="none"
          stroke="#4ECDC4"
          strokeWidth={3}
        />
        {data.map((item, index) => {
          const x = padding + (index / (data.length - 1)) * chartWidth;
          const y = padding + (1 - (item.impact - minValue) / (maxValue - minValue)) * chartHeight;
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r={4}
              fill="#4ECDC4"
              stroke="#ffffff"
              strokeWidth={2}
            />
          );
        })}
      </Svg>
    </View>
  );
};

export const SimpleBarChart: React.FC<BarChartProps> = ({ data, width, height }) => {
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = chartWidth / data.length * 0.8;
  const barSpacing = chartWidth / data.length * 0.2;
  
  return (
    <View style={[styles.chartContainer, { width, height }]}>
      <Svg width={width} height={height}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x = padding + index * (barWidth + barSpacing);
          const y = padding + chartHeight - barHeight;
          
          return (
            <React.Fragment key={index}>
              <Path
                d={`M ${x} ${y} L ${x + barWidth} ${y} L ${x + barWidth} ${padding + chartHeight} L ${x} ${padding + chartHeight} Z`}
                fill="#4ECDC4"
                stroke="#ffffff"
                strokeWidth={1}
              />
              <SvgText
                x={x + barWidth / 2}
                y={padding + chartHeight + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#ffffff"
              >
                {item.name}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 