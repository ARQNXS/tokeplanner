import React, { useState, useEffect } from 'react';
import {
  Button, Card, CardContent, CardHeader, Typography, TextField, Table, TableHead, TableRow,
  TableCell, TableBody, Grid, Box, Select, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Tooltip, ThemeProvider, createTheme, CssBaseline, ToggleButton,
  ToggleButtonGroup, Slider
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import { SketchPicker } from 'react-color';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

const TokenomicsPlanner = () => {
  const [totalTokens, setTotalTokens] = useState(0);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [tokenomicsPlan, setTokenomicsPlan] = useState(null);
  const [vestingEmphasis, setVestingEmphasis] = useState('balanced');
  const [categories, setCategories] = useState([
    { id: 1, name: 'Team', color: '#FF6384', percentage: 20, vestingType: 'linear', vestingPeriod: 24 },
    { id: 2, name: 'Marketing', color: '#36A2EB', percentage: 15, vestingType: 'linear', vestingPeriod: 24 },
    { id: 3, name: 'Development', color: '#FFCE56', percentage: 25, vestingType: 'linear', vestingPeriod: 24 },
    { id: 4, name: 'Investors', color: '#4BC0C0', percentage: 10, vestingType: 'linear', vestingPeriod: 24 },
    { id: 5, name: 'Community', color: '#9966FF', percentage: 30, vestingType: 'linear', vestingPeriod: 24 },
  ]);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [projectedROI, setProjectedROI] = useState(null);
  const [netBuyingPressure, setNetBuyingPressure] = useState([]);
  const [accumulatedBuyingPressure, setAccumulatedBuyingPressure] = useState([]);
  const [circulatingSupply, setCirculatingSupply] = useState([]);
  const [marketCap, setMarketCap] = useState([]);
  const [annualizedInflation, setAnnualizedInflation] = useState([]);
  const [treasuryReserves, setTreasuryReserves] = useState(0);
  const [kpiSnapshot, setKpiSnapshot] = useState({});
  const [stressTestScenario, setStressTestScenario] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);


  const runSimulation = () => {
    if (!tokenomicsPlan) {
      alert('Please generate a tokenomics plan first.');
      return;
    }
  
    const simulationMonths = 36; // 3 years
    const results = [];
    let currentPrice = tokenPrice;
    let currentCirculatingSupply = 0;
    let marketSentiment = 1; // 1 is neutral, > 1 is bullish, < 1 is bearish
    let volatility = 0.1; // Initial volatility
  
    const updateMarketSentiment = () => {
      const sentimentChange = (Math.random() - 0.5) * 0.1; // -5% to 5% change
      marketSentiment = Math.max(0.5, Math.min(1.5, marketSentiment + sentimentChange));
    };
  
    const simulateExternalEvent = () => {
      if (Math.random() < 0.05) { // 5% chance of an external event each month
        const eventImpact = (Math.random() - 0.5) * 0.4; // -20% to 20% impact
        marketSentiment *= (1 + eventImpact);
        volatility *= (1 + Math.abs(eventImpact));
      }
    };
  
    for (let month = 1; month <= simulationMonths; month++) {
      // Calculate newly released tokens
      let newlyReleasedTokens = 0;
      Object.values(tokenomicsPlan).forEach(category => {
        const releaseForMonth = category.vestingSchedule.find(entry => entry.month === month);
        if (releaseForMonth) {
          newlyReleasedTokens += releaseForMonth.tokens - (category.vestingSchedule.find(entry => entry.month === month - 1)?.tokens || 0);
        }
      });
  
      const previousCirculatingSupply = currentCirculatingSupply;
      currentCirculatingSupply += newlyReleasedTokens;
  
      // Update market conditions
      updateMarketSentiment();
      simulateExternalEvent();
  
      // Simulate market behavior
      const buyPressure = (Math.random() * volatility + 1) * marketSentiment;
      const sellPressure = (Math.random() * volatility + 1) / marketSentiment;
  
      // Adjust price based on buy/sell pressure, newly released tokens, and market conditions
      const supplyImpact = Math.max(0.95, 1 - (newlyReleasedTokens / currentCirculatingSupply));
      const priceAdjustment = (buyPressure / sellPressure) * supplyImpact;
      currentPrice *= priceAdjustment;
  
      // Ensure price doesn't go below a minimum threshold
      currentPrice = Math.max(currentPrice, tokenPrice * 0.1);
  
      // Simulate trading volume based on price movement and market sentiment
      const tradingVolume = currentCirculatingSupply * Math.abs(priceAdjustment - 1) * marketSentiment;
  
      // Calculate market cap
      const marketCap = currentCirculatingSupply * currentPrice;
  
      // Calculate annualized inflation
      const monthlyInflation = (currentCirculatingSupply - previousCirculatingSupply) / previousCirculatingSupply;
      const annualizedInflation = (Math.pow(1 + monthlyInflation, 12) - 1) * 100;
  
      // Update volatility based on price change
      volatility = Math.max(0.05, Math.min(0.5, volatility * (1 + Math.abs(priceAdjustment - 1))));
  
      results.push({
        month,
        price: currentPrice,
        circulatingSupply: currentCirculatingSupply,
        marketCap,
        newlyReleasedTokens,
        tradingVolume,
        marketSentiment,
        volatility,
        annualizedInflation
      });
    }
  
    setSimulationResults(results);
  };

  const vestingTypes = {
    linear: { name: 'Linear', description: 'Tokens are released at a constant rate over time.' },
    exponential: { name: 'Exponential', description: 'Token release rate increases over time.' },
    logarithmic: { name: 'Logarithmic', description: 'Token release rate decreases over time.' },
    cliff: { name: 'Cliff', description: 'No tokens are released until a specific date, then all are released at once.' },
  };

  const handleVestingEmphasisChange = (event, newEmphasis) => {
    if (newEmphasis !== null) {
      setVestingEmphasis(newEmphasis);
      updateVestingSchedules(newEmphasis);
    }
  };

  const updateVestingSchedules = (emphasis) => {
    let updatedCategories = [...categories];
    switch (emphasis) {
      case 'team':
        updatedCategories = updatedCategories.map(cat => {
          if (cat.name === 'Team') {
            return {...cat, vestingType: 'logarithmic', vestingPeriod: 48};
          } else if (cat.name === 'Investors') {
            return {...cat, vestingType: 'cliff', vestingPeriod: 12};
          } else {
            return {...cat, vestingType: 'linear', vestingPeriod: 24};
          }
        });
        break;
      case 'investors':
        updatedCategories = updatedCategories.map(cat => {
          if (cat.name === 'Investors') {
            return {...cat, vestingType: 'linear', vestingPeriod: 12};
          } else if (cat.name === 'Team') {
            return {...cat, vestingType: 'cliff', vestingPeriod: 24};
          } else {
            return {...cat, vestingType: 'exponential', vestingPeriod: 36};
          }
        });
        break;
      case 'community':
        updatedCategories = updatedCategories.map(cat => {
          if (cat.name === 'Community') {
            return {...cat, vestingType: 'linear', vestingPeriod: 12};
          } else if (cat.name === 'Team' || cat.name === 'Investors') {
            return {...cat, vestingType: 'cliff', vestingPeriod: 18};
          } else {
            return {...cat, vestingType: 'logarithmic', vestingPeriod: 36};
          }
        });
        break;
      default:
        updatedCategories = updatedCategories.map(cat => ({...cat, vestingType: 'linear', vestingPeriod: 24}));
    }
    setCategories(updatedCategories);
  };

  const handleOpenCategoryDialog = (category = null) => {
    setEditingCategory(category || { name: '', color: '#000000', percentage: 0, vestingType: 'linear', vestingPeriod: 24 });
    setOpenCategoryDialog(true);
  };

  const handleCloseCategoryDialog = () => {
    setEditingCategory(null);
    setOpenCategoryDialog(false);
  };

  const handleSaveCategory = () => {
    if (editingCategory.name && editingCategory.color && editingCategory.percentage && editingCategory.vestingType) {
      if (categories.find(cat => cat.name === editingCategory.name && cat.id !== editingCategory.id)) {
        alert('A category with this name already exists.');
        return;
      }
      
      const newCategories = editingCategory.id
        ? categories.map(cat => cat.id === editingCategory.id ? editingCategory : cat)
        : [...categories, { ...editingCategory, id: Date.now() }];
      
      setCategories(newCategories);
      handleCloseCategoryDialog();
    } else {
      alert('Please fill in all fields.');
    }
  };

  const handleDeleteCategory = (categoryId) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  const generateTokenomicsPlan = () => {
    if (categories.reduce((sum, cat) => sum + cat.percentage, 0) !== 100) {
      alert('Total percentage must equal 100%');
      return;
    }

    const plan = {};
    categories.forEach((category) => {
      const tokens = Math.floor((totalTokens * category.percentage) / 100);
      const vestingDetails = calculateVestingSchedule(category.vestingType, tokens, category.vestingPeriod);

      plan[category.name] = {
        tokens,
        percentage: category.percentage,
        vestingType: category.vestingType,
        vestingPeriod: category.vestingPeriod,
        ...vestingDetails
      };
    });

    setTokenomicsPlan(plan);
    calculateNetBuyingPressure(plan);
    calculateAccumulatedBuyingPressure();
    calculateCirculatingSupply(plan);
    calculateMarketCap();
    calculateAnnualizedInflation(plan);
    calculateTreasuryReserves();
    generateKPISnapshot();
    runStressTest(plan);
  };

  const calculateVestingSchedule = (vestingType, tokens, vestingPeriod) => {
    let schedule = [];

    switch (vestingType) {
      case 'linear':
        for (let i = 1; i <= vestingPeriod; i++) {
          schedule.push({ month: i, tokens: (tokens / vestingPeriod) * i });
        }
        break;
      case 'exponential':
        for (let i = 1; i <= vestingPeriod; i++) {
          schedule.push({ month: i, tokens: tokens * (1 - Math.exp(-3 * i / vestingPeriod)) });
        }
        break;
      case 'logarithmic':
        for (let i = 1; i <= vestingPeriod; i++) {
          schedule.push({ month: i, tokens: tokens * (Math.log(i + 1) / Math.log(vestingPeriod + 1)) });
        }
        break;
      case 'cliff':
        for (let i = 1; i <= vestingPeriod; i++) {
          schedule.push({ month: i, tokens: i === vestingPeriod ? tokens : 0 });
        }
        break;
      default:
        schedule = [];
    }

    return {
      vestingSchedule: schedule
    };
  };

  const calculateROI = () => {
    if (!tokenomicsPlan || !investmentAmount || !tokenPrice) return;

    const totalInvestment = investmentAmount;
    const tokensReceived = totalInvestment / tokenPrice;

    const projectedROI = [];
    const months = [6, 12, 24, 36];

    months.forEach(month => {
      let releasedTokens = 0;
      Object.values(tokenomicsPlan).forEach(category => {
        const lastScheduleEntry = category.vestingSchedule.find(entry => entry.month === month) || 
                                  category.vestingSchedule[category.vestingSchedule.length - 1];
        releasedTokens += lastScheduleEntry.tokens;
      });

      const tokenValue = releasedTokens * tokenPrice;
      const roi = ((tokenValue - totalInvestment) / totalInvestment) * 100;

      projectedROI.push({ month, roi });
    });

    setProjectedROI(projectedROI);
  };

  const calculateNetBuyingPressure = (plan) => {
    const monthlyPressure = [];
    const maxMonths = Math.max(...Object.values(plan).map(cat => cat.vestingPeriod));
    
    for (let month = 1; month <= maxMonths; month++) {
      let monthlyRelease = 0;
      Object.values(plan).forEach(category => {
        const releaseForMonth = category.vestingSchedule.find(entry => entry.month === month);
        if (releaseForMonth) {
          monthlyRelease += releaseForMonth.tokens;
        }
      });
      
      const marketDemand = totalTokens * 0.01 * (1 + Math.random() * 0.1);
      
      const netPressure = marketDemand - monthlyRelease;
      monthlyPressure.push({ month, netPressure });
    }
    
    setNetBuyingPressure(monthlyPressure);
  };

  const calculateAccumulatedBuyingPressure = () => {
    let accumulated = 0;
    const accumulatedPressure = netBuyingPressure.map(({ month, netPressure }) => {
      accumulated += netPressure;
      return { month, accumulatedPressure: accumulated };
    });
    setAccumulatedBuyingPressure(accumulatedPressure);
  };

  const calculateCirculatingSupply = (plan) => {
    const supply = [];
    const maxMonths = Math.max(...Object.values(plan).map(cat => cat.vestingPeriod));
    
    for (let month = 1; month <= maxMonths; month++) {
      let circulatingTokens = 0;
      Object.values(plan).forEach(category => {
        const releaseForMonth = category.vestingSchedule.find(entry => entry.month === month);
        if (releaseForMonth) {
          circulatingTokens += releaseForMonth.tokens;
        }
      });
      supply.push({ month, circulatingTokens });
    }
    
    setCirculatingSupply(supply);
  };

  const calculateMarketCap = () => {
    const marketCapData = circulatingSupply.map(({ month, circulatingTokens }) => ({
      month,
      marketCap: circulatingTokens * tokenPrice
    }));
    setMarketCap(marketCapData);
  };

  const calculateAnnualizedInflation = (plan) => {
    const inflationData = [];
    const maxMonths = Math.max(...Object.values(plan).map(cat => cat.vestingPeriod));
    
    for (let month = 1; month <= maxMonths; month++) {
      const currentCirculating = circulatingSupply.find(entry => entry.month === month)?.circulatingTokens || 0;
      const prevCirculating = circulatingSupply.find(entry => entry.month === month - 1)?.circulatingTokens || 0;
      
      if (prevCirculating === 0) continue;
      
      const monthlyInflation = (currentCirculating - prevCirculating) / prevCirculating;
      const annualizedInflation = Math.pow(1 + monthlyInflation, 12) - 1;
      
      inflationData.push({ month, annualizedInflation: annualizedInflation * 100 });
    }
    
    setAnnualizedInflation(inflationData);
  };

  const calculateTreasuryReserves = () => {
    const reserves = totalTokens * tokenPrice * 0.1;
    setTreasuryReserves(reserves);
  };

  const generateKPISnapshot = () => {
    const latestCirculatingSupply = circulatingSupply[circulatingSupply.length - 1]?.circulatingTokens || 0;
    const latestMarketCap = marketCap[marketCap.length - 1]?.marketCap || 0;
    const latestInflation = annualizedInflation[annualizedInflation.length - 1]?.annualizedInflation || 0;

    setKpiSnapshot({
      totalSupply: totalTokens,
      circulatingSupply: latestCirculatingSupply,
      marketCap: latestMarketCap,
      currentPrice: tokenPrice,
      annualizedInflation: latestInflation,
      treasuryReserves: treasuryReserves
    });
  };

  const runStressTest = (plan) => {
    const stressedPrice = tokenPrice * 0.7; // Simulate a 30% price drop
    const stressedMarketCap = circulatingSupply.map(({ month, circulatingTokens }) => ({
      month,
      marketCap: circulatingTokens * stressedPrice
    }));

    setStressTestScenario({
      stressedPrice,
      stressedMarketCap
    });
  };

  useEffect(() => {
    if (tokenomicsPlan) {
      calculateROI();
    }
  }, [tokenomicsPlan, investmentAmount, tokenPrice]);

  const generateLineChartData = () => {
    if (!tokenomicsPlan) return [];

    const data = [];
    const maxMonths = Math.max(...Object.values(tokenomicsPlan).map(cat => cat.vestingPeriod));

    for (let month = 0; month <= maxMonths; month++) {
      const dataPoint = { month };
      Object.entries(tokenomicsPlan).forEach(([category, details]) => {
        const scheduleEntry = details.vestingSchedule.find(entry => entry.month === month) || 
                              details.vestingSchedule[details.vestingSchedule.length - 1];
        dataPoint[category] = scheduleEntry.tokens;
      });
      data.push(dataPoint);
    }

    return data;
  };

  const exportAsPDF = () => {
    if (!tokenomicsPlan) {
      alert('Please generate a tokenomics plan first.');
      return;
    }

    const doc = new jsPDF();
    doc.text('Tokenomics Plan', 20, 10);

    let yOffset = 30;
    Object.entries(tokenomicsPlan).forEach(([category, details]) => {
      doc.text(`${category}:`, 20, yOffset);
      doc.text(`Tokens: ${details.tokens.toLocaleString()}`, 30, yOffset + 10);
      doc.text(`Percentage: ${details.percentage}%`, 30, yOffset + 20);
      doc.text(`Vesting Type: ${details.vestingType}`, 30, yOffset + 30);
      doc.text(`Vesting Period: ${details.vestingPeriod} months`, 30, yOffset + 40);
      yOffset += 60;

      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }
    });

    doc.addPage();
    doc.text('KPI Snapshot', 20, 10);
    Object.entries(kpiSnapshot).forEach(([key, value], index) => {
      doc.text(`${key}: ${value}`, 20, 30 + index * 10);
    });

    doc.save('comprehensive_tokenomics_plan.pdf');
  };

  const exportAsExcel = () => {
    if (!tokenomicsPlan) {
      alert('Please generate a tokenomics plan first.');
      return;
    }

    const workbook = XLSX.utils.book_new();

    const mainSheet = XLSX.utils.json_to_sheet(
      Object.entries(tokenomicsPlan).map(([category, details]) => ({
        Category: category,
        Tokens: details.tokens,
        Percentage: `${details.percentage}%`,
        'Vesting Type': details.vestingType,
        'Vesting Period': `${details.vestingPeriod} months`,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Tokenomics Plan');

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(netBuyingPressure), 'Net Buying Pressure');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(accumulatedBuyingPressure), 'Accumulated Buying Pressure');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(circulatingSupply), 'Circulating Supply');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(marketCap), 'Market Cap');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(annualizedInflation), 'Annualized Inflation');

    const kpiSheet = XLSX.utils.json_to_sheet([kpiSnapshot]);
    XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPI Snapshot');

    XLSX.writeFile(workbook, 'comprehensive_tokenomics_plan.xlsx');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ padding: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          TokeTool
        </Typography>

        <Grid container spacing={2} sx={{ marginBottom: 4 }}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Total Tokens"
              type="number"
              value={totalTokens}
              onChange={(e) => setTotalTokens(parseInt(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Token Price (USD)"
              type="number"
              value={tokenPrice}
              onChange={(e) => setTokenPrice(parseFloat(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Investment Amount (USD)"
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(parseFloat(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" gutterBottom>
              Vesting Emphasis
            </Typography>
            <ToggleButtonGroup
              value={vestingEmphasis}
              exclusive
              onChange={handleVestingEmphasisChange}
              aria-label="vesting emphasis"
            >
              <ToggleButton value="team" aria-label="team emphasis">
                Team
              </ToggleButton>
              <ToggleButton value="investors" aria-label="investors emphasis">
                Investors
              </ToggleButton>
              <ToggleButton value="community" aria-label="community emphasis">
                Community
              </ToggleButton>
              <ToggleButton value="balanced" aria-label="balanced emphasis">
                Balanced
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>

        <Card sx={{ marginBottom: 4 }}>
          <CardHeader
            title="Token Categories"
            action={
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenCategoryDialog()}
              >
                Add Category
              </Button>
            }
          />
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Percentage</TableCell>
                  <TableCell>Vesting Type</TableCell>
                  <TableCell>Vesting Period</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: category.color,
                          borderRadius: '50%',
                          border: '1px solid #ffffff',
                        }}
                      />
                    </TableCell>
                    <TableCell>{category.percentage}%</TableCell>
                    <TableCell>{vestingTypes[category.vestingType].name}</TableCell>
                    <TableCell>{category.vestingPeriod} months</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenCategoryDialog(category)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteCategory(category.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Button
          variant="contained"
          color="primary"
          onClick={generateTokenomicsPlan}
          sx={{ marginBottom: 4 }}
        >
          Generate Comprehensive Tokenomics Plan
        </Button>

        {tokenomicsPlan && (
          <>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Token Allocation" />
                  <CardContent>
                    <PieChart width={400} height={400}>
                      <Pie
                        data={Object.entries(tokenomicsPlan).map(([category, details]) => ({
                          name: category,
                          value: details.percentage,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                        label
                      >
                        {Object.entries(tokenomicsPlan).map(([category, details], index) => (
                          <Cell key={`cell-${index}`} fill={categories.find((cat) => cat.name === category).color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Token Distribution" />
                  <CardContent>
                    <BarChart width={500} height={400} data={Object.entries(tokenomicsPlan).map(([category, details]) => ({ category, tokens: details.tokens }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="tokens" fill="#8884d8" />
                    </BarChart>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card sx={{ marginTop: 4 }}>
              <CardHeader title="Vesting Schedule" />
              <CardContent>
                <LineChart width={1000} height={500} data={generateLineChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  {Object.keys(tokenomicsPlan).map((category, index) => (
                    <Line key={category} type="monotone" dataKey={category} stroke={categories[index].color} strokeWidth={2} />
                  ))}
                </LineChart>
              </CardContent>
            </Card>

            <Card sx={{ marginTop: 4 }}>
              <CardHeader title="Net Buying Pressure" />
              <CardContent>
                <LineChart width={1000} height={300} data={netBuyingPressure}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="netPressure" stroke="#8884d8" />
                </LineChart>
              </CardContent>
            </Card>

            <Card sx={{ marginTop: 4 }}>
              <CardHeader title="Circulating Supply" />
              <CardContent>
                <AreaChart width={1000} height={300} data={circulatingSupply}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="circulatingTokens" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </CardContent>
            </Card>

            <Card sx={{ marginTop: 4 }}>
              <CardHeader title="Market Cap" />
              <CardContent>
                <LineChart width={1000} height={300} data={marketCap}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="marketCap" stroke="#8884d8" />
                </LineChart>
              </CardContent>
            </Card>

            <Card sx={{ marginTop: 4 }}>
              <CardHeader title="Annualized Inflation" />
              <CardContent>
                <LineChart width={1000} height={300} data={annualizedInflation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="annualizedInflation" stroke="#82ca9d" />
                </LineChart>
              </CardContent>
            </Card>

            <Card sx={{ marginTop: 4 }}>
              <CardHeader title="KPI Snapshot" />
              <CardContent>
                <Table>
                  <TableBody>
                    {Object.entries(kpiSnapshot).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell component="th" scope="row">
                          {key}
                        </TableCell>
                        <TableCell align="right">{typeof value === 'number' ? value.toLocaleString() : value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card sx={{ marginTop: 4 }}>
              <CardHeader title="Stress Test Results" />
              <CardContent>
                {stressTestScenario && (
                  <>
                    <Typography variant="body1" gutterBottom>
                      Stressed Token Price: ${stressTestScenario.stressedPrice.toFixed(2)}
                    </Typography>
                    <LineChart width={1000} height={300} data={stressTestScenario.stressedMarketCap}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="marketCap" stroke="#ff7300" name="Stressed Market Cap" />
                    </LineChart>
                  </>
                )}
              </CardContent>
            </Card>

            {projectedROI && (
              <Card sx={{ marginTop: 4 }}>
                <CardHeader title="Projected ROI" />
                <CardContent>
                  <LineChart width={1000} height={300} data={projectedROI}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="roi" stroke="#82ca9d" />
                  </LineChart>
                </CardContent>
              </Card>
            )}

{simulationResults && (
              <Card sx={{ marginTop: 4 }}>
                <CardHeader title="Market Simulation Results" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <LineChart width={500} height={300} data={simulationResults}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="price" stroke="#8884d8" name="Token Price" />
                        <Line yAxisId="right" type="monotone" dataKey="circulatingSupply" stroke="#82ca9d" name="Circulating Supply" />
                      </LineChart>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <LineChart width={500} height={300} data={simulationResults}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="marketCap" stroke="#ffc658" name="Market Cap" />
                      </LineChart>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            <Box sx={{ marginTop: 4 }}>
              <Button 
                variant="contained" 
                color="secondary" 
                sx={{ marginRight: 2 }}
                onClick={exportAsPDF}
              >
                Export as PDF
              </Button>

              <Button 
                variant="contained" 
                color="secondary" 
                sx={{ marginRight: 2 }}
                onClick={exportAsExcel}
              >
                Export as Excel
              </Button>

              <Button
                variant="contained"
                color="secondary"
                onClick={runSimulation}
                sx={{ marginBottom: 4 }}
                >
                Run Simulation
            </Button>

            </Box>
          </>
        )}

        <Dialog open={openCategoryDialog} onClose={handleCloseCategoryDialog}>
          <DialogTitle>{editingCategory && editingCategory.id ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Category Name"
              fullWidth
              value={editingCategory ? editingCategory.name : ''}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
            />
            <Box sx={{ marginY: 2 }}>
              <Typography gutterBottom>Category Color</Typography>
              <SketchPicker
                color={editingCategory ? editingCategory.color : '#000000'}
                onChangeComplete={(color) => setEditingCategory({ ...editingCategory, color: color.hex })}
              />
            </Box>
            <TextField
              margin="dense"
              label="Percentage"
              type="number"
              fullWidth
              value={editingCategory ? editingCategory.percentage : ''}
              onChange={(e) => setEditingCategory({ ...editingCategory, percentage: parseFloat(e.target.value) })}
            />
            <Select
              margin="dense"
              label="Vesting Type"
              fullWidth
              value={editingCategory ? editingCategory.vestingType : 'linear'}
              onChange={(e) => setEditingCategory({ ...editingCategory, vestingType: e.target.value })}
            >
              {Object.entries(vestingTypes).map(([type, { name }]) => (
                <MenuItem key={type} value={type}>{name}</MenuItem>
              ))}
            </Select>
            <TextField
              margin="dense"
              label="Vesting Period (months)"
              type="number"
              fullWidth
              value={editingCategory ? editingCategory.vestingPeriod : 24}
              onChange={(e) => setEditingCategory({ ...editingCategory, vestingPeriod: parseInt(e.target.value) })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCategoryDialog}>Cancel</Button>
            <Button onClick={handleSaveCategory}>Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default TokenomicsPlanner;