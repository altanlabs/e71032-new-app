import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';

type TimeFrame = '1D' | '1S' | '1M' | '3M' | '1A';

interface ChartDataPoint {
  time: string;
  value: number;
}

interface RsiDataPoint {
  time: string;
  rsi: number;
}

// Función para generar datos históricos simulados
const generateHistoricalData = (baseValue: number, days: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  let currentValue = baseValue;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Añadir algo de volatilidad aleatoria
    const change = (Math.random() - 0.5) * (baseValue * 0.02);
    currentValue = currentValue + change;
    
    data.push({
      time: date.toLocaleDateString(),
      value: Number(currentValue.toFixed(2))
    });
  }
  
  return data;
};

// Función para exportar a Excel
const exportToExcel = (data: ChartDataPoint[], symbol: string): void => {
  // Preparar los datos para Excel
  const excelData = data.map(item => ({
    Fecha: item.time,
    [`Precio ${symbol} (EUR)`]: item.value,
  }));

  // Crear un nuevo libro de trabajo
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Añadir la hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, `Precios ${symbol}`);

  // Generar el archivo y descargarlo
  XLSX.writeFile(wb, `precios_historicos_${symbol.toLowerCase()}.xlsx`);
};

// Función para calcular el RSI
const calculateRSI = (data: ChartDataPoint[]): RsiDataPoint[] => {
  const rsiPeriod = 14;
  const rsiData: RsiDataPoint[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < rsiPeriod) {
      rsiData.push({
        time: data[i].time,
        rsi: 50 + Math.random() * 20 - 10
      });
      continue;
    }

    const currentPrice = data[i].value;
    const previousPrice = data[i - 1].value;
    const trend = currentPrice - previousPrice;
    
    const lastRsi: number = rsiData[i - 1].rsi;
    let newRsi: number = lastRsi + (trend * 2);
    newRsi = Math.max(0, Math.min(100, newRsi));
    
    rsiData.push({
      time: data[i].time,
      rsi: newRsi
    });
  }
  
  return rsiData;
};

interface HistoricalData {
  [key in TimeFrame]: ChartDataPoint[];
}

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  historicalData: HistoricalData;
}

// Generar datos históricos para cada empresa
const generateStockData = (basePrice: number): HistoricalData => {
  return {
    '1D': generateHistoricalData(basePrice, 1),
    '1S': generateHistoricalData(basePrice, 7),
    '1M': generateHistoricalData(basePrice, 30),
    '3M': generateHistoricalData(basePrice, 90),
    '1A': generateHistoricalData(basePrice, 365)
  };
};

// Sample data con diferentes temporalidades
const sampleStocks: Stock[] = [
  { 
    symbol: "SAN", 
    name: "Banco Santander", 
    price: 3.85, 
    change: +0.45, 
    changePercent: +1.23,
    historicalData: generateStockData(3.85)
  },
  { 
    symbol: "TEF", 
    name: "Telefónica", 
    price: 3.62, 
    change: -0.12, 
    changePercent: -0.89,
    historicalData: generateStockData(3.62)
  },
  { 
    symbol: "IBE", 
    name: "Iberdrola", 
    price: 11.24, 
    change: +0.28, 
    changePercent: +2.15,
    historicalData: generateStockData(11.24)
  },
  { 
    symbol: "BBVA", 
    name: "BBVA", 
    price: 8.12, 
    change: +0.15, 
    changePercent: +1.78,
    historicalData: generateStockData(8.12)
  },
  { 
    symbol: "ITX", 
    name: "Inditex", 
    price: 42.65, 
    change: +1.23, 
    changePercent: +3.12,
    historicalData: generateStockData(42.65)
  },
  { 
    symbol: "REP", 
    name: "Repsol", 
    price: 14.85, 
    change: -0.32, 
    changePercent: -2.11,
    historicalData: generateStockData(14.85)
  },
];

// IBEX 35 data
const ibexHistoricalData: HistoricalData = generateStockData(10000);

export default function IndexPage() {
  const [selectedStock, setSelectedStock] = useState<{
    symbol: string;
    data: ChartDataPoint[];
  }>({ symbol: "IBEX 35", data: ibexHistoricalData['1D'] });

  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1D');

  const handleStockClick = (stock: Stock) => {
    setSelectedStock({
      symbol: stock.symbol,
      data: stock.historicalData[timeFrame]
    });
  };

  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
    if (selectedStock.symbol === "IBEX 35") {
      setSelectedStock({
        symbol: "IBEX 35",
        data: ibexHistoricalData[newTimeFrame]
      });
    } else {
      const stock = sampleStocks.find(s => s.symbol === selectedStock.symbol);
      if (stock) {
        setSelectedStock({
          symbol: stock.symbol,
          data: stock.historicalData[newTimeFrame]
        });
      }
    }
  };

  const handleExportToExcel = () => {
    const stock = sampleStocks.find(s => s.symbol === "TEF");
    if (stock) {
      // Exportar datos anuales para tener el histórico completo
      exportToExcel(stock.historicalData['1A'], stock.symbol);
    }
  };

  // Calcular RSI para los datos seleccionados
  const rsiData = calculateRSI(selectedStock.data);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">IBEX 35 - Principales Cotizaciones</h1>
      
      {/* Market Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-4">
              <span>Evolución {selectedStock.symbol}</span>
              {selectedStock.symbol !== "IBEX 35" && (
                <button 
                  onClick={() => {
                    setSelectedStock({ 
                      symbol: "IBEX 35", 
                      data: ibexHistoricalData[timeFrame] 
                    });
                  }}
                  className="text-sm px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                >
                  Volver al IBEX 35
                </button>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {(['1D', '1S', '1M', '3M', '1A'] as TimeFrame[]).map((tf) => (
                <Button
                  key={tf}
                  variant={timeFrame === tf ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeFrameChange(tf)}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gráfico principal */}
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedStock.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time"
                  tickFormatter={(value) => {
                    if (timeFrame === '1D') return value;
                    const date = new Date(value);
                    return date.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short'
                    });
                  }}
                />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip 
                  labelFormatter={(value) => {
                    if (timeFrame === '1D') return value;
                    return new Date(value).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    });
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico RSI */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rsiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time"
                  tickFormatter={(value) => {
                    if (timeFrame === '1D') return value;
                    const date = new Date(value);
                    return date.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short'
                    });
                  }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  ticks={[0, 30, 70, 100]} 
                  label={{ value: 'RSI', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  labelFormatter={(value) => {
                    if (timeFrame === '1D') return value;
                    return new Date(value).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    });
                  }}
                />
                <CartesianGrid strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="rsi" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
                <line 
                  x1="0" 
                  y1="70" 
                  x2="100%" 
                  y2="70" 
                  stroke="red" 
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                />
                <line 
                  x1="0" 
                  y1="30" 
                  x2="100%" 
                  y2="30" 
                  stroke="red" 
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stocks Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Valores Principales</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
            >
              Exportar datos TEF a Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Símbolo</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Cambio</TableHead>
                <TableHead className="text-right">Variación %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleStocks.map((stock) => (
                <TableRow 
                  key={stock.symbol}
                  className={`cursor-pointer hover:bg-muted/50 ${selectedStock.symbol === stock.symbol ? 'bg-muted' : ''}`}
                  onClick={() => handleStockClick(stock)}
                >
                  <TableCell className="font-medium">{stock.symbol}</TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell className="text-right">{stock.price.toFixed(2)} €</TableCell>
                  <TableCell className={`text-right ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} €
                  </TableCell>
                  <TableCell className={`text-right ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}