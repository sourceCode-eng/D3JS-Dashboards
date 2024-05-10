// Function to fetch data from the API
async function fetchData(symbol, apiKey, days) {
  const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    return null;
  }
}

// Function to transform fetched data into candlestick format
function transformData(data, days) {
  const timeSeries = data["Time Series (Daily)"];
  const dates = Object.keys(timeSeries).sort().slice(0, days);
  const candlestickData = dates.map(date => {
    const dailyData = timeSeries[date];
    return {
      Date: new Date(date),
      Open: +dailyData["1. open"],
      High: +dailyData["2. high"],
      Low: +dailyData["3. low"],
      Close: +dailyData["4. close"],
    };
  });
  return candlestickData;
}

// Function to create candlestick chart
function createCandlestickChart(data) {
  // Declare the chart dimensions and margins.
  const width = 928;
  const height = 600;
  const marginTop = 20;
  const marginRight = 30;
  const marginBottom = 30;
  const marginLeft = 40;

  // Declare the positional encodings.
  const x = d3.scaleBand()
    .domain(data.map(d => d.Date))
    .range([marginLeft, width - marginRight])
    .padding(0.2);

  const y = d3.scaleLog()
    .domain([d3.min(data, d => d.Low), d3.max(data, d => d.High)])
    .rangeRound([height - marginBottom, marginTop]);

  // Create the SVG container.
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height]);

  // Append the axes.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x)
      .tickValues(d3.utcMonday
        .every(width > 720 ? 1 : 2)
        .range(data[0].Date, data[data.length - 1].Date))
      .tickFormat(d3.utcFormat("%-m/%-d")))
    .call(g => g.select(".domain").remove());

  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y)
      .tickFormat(d3.format("$~f"))
      .tickValues(d3.scaleLinear().domain(y.domain()).ticks()))
    .call(g => g.selectAll(".tick line").clone()
      .attr("stroke-opacity", 0.2)
      .attr("x2", width - marginLeft - marginRight))
    .call(g => g.select(".domain").remove());

  // Create a group for each day of data, and append two lines to it.
  const g = svg.append("g")
    .attr("stroke-linecap", "round")
    .attr("stroke", "black")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", d => `translate(${x(d.Date)},0)`);

  g.append("line")
    .attr("y1", d => y(d.Low))
    .attr("y2", d => y(d.High));

  g.append("line")
    .attr("y1", d => y(d.Open))
    .attr("y2", d => y(d.Close))
    .attr("stroke-width", x.bandwidth())
    .attr("stroke", d => d.Open > d.Close ? d3.schemeSet1[0]
      : d.Close > d.Open ? d3.schemeSet1[2]
      : d3.schemeSet1[8]);

  // Append a title (tooltip).
  const formatDate = d3.utcFormat("%B %-d, %Y");
  const formatValue = d3.format(".2f");
  const formatChange = ((f) => (y0, y1) => f((y1 - y0) / y0))(d3.format("+.2%"));

  g.append("title")
    .text(d => `${formatDate(d.Date)}
Open: ${formatValue(d.Open)}
Close: ${formatValue(d.Close)} (${formatChange(d.Open, d.Close)})
Low: ${formatValue(d.Low)}
High: ${formatValue(d.High)}`);

  return svg.node();
}

// Main function to fetch data and create chart
async function main() {
  const apiKey = 'YOUR_API_KEY'; // Replace 'YOUR_API_KEY' with your actual API key
  const symbolInput = document.getElementById('symbol');
  const daysSlider = document.getElementById('days');
  const selectedDays = document.getElementById('selectedDays');

  // Initial chart render
  let data = await fetchData(symbolInput.value, apiKey, daysSlider.value);
  if (data) {
    const candlestickData = transformData(data, daysSlider.value);
    const chart = createCandlestickChart(candlestickData);
    document.getElementById('chart').appendChild(chart);
  } else {
    console.error('Failed to fetch data or transform data.');
  }

  // Update chart when slider value changes
  daysSlider.addEventListener('input', async () => {
    selectedDays.textContent = `${daysSlider.value} days`;
    const newData = await fetchData(symbolInput.value, apiKey, daysSlider.value);
    if (newData) {
      const newCandlestickData = transformData(newData, daysSlider.value);
      const chart = createCandlestickChart(newCandlestickData);
      document.getElementById('chart').innerHTML = '';
      document.getElementById('chart').appendChild(chart);
    } else {
      console.error('Failed to fetch data or transform data.');
    }
  });

  // Update chart when symbol input changes
  symbolInput.addEventListener('input', async () => {
    const newData = await fetchData(symbolInput.value, apiKey, daysSlider.value);
    if (newData) {
      const newCandlestickData = transformData(newData, daysSlider.value);
      const chart = createCandlestickChart(newCandlestickData);
      document.getElementById('chart').innerHTML = '';
      document.getElementById('chart').appendChild(chart);
    } else {
      console.error('Failed to fetch data or transform data.');
    }
  });
}

// Execute main function
main();
