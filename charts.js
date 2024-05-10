const currencyData = {};
const sectorData = {};
const sharesData = [];

function fetchData(symbol) {
  const apiKey = '5mxfZ6xaNFhgpQvJOVwzTFUxFbF0aFVw';
  const apiUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      const currency = data.Currency;
      const sector = data.Sector;
      const sharesOutstanding = +data.SharesOutstanding;

      // Update currency distribution
      if (currencyData[currency]) {
        currencyData[currency]++;
      } else {
        currencyData[currency] = 1;
      }

      // Update sector distribution
      if (sectorData[sector]) {
        sectorData[sector]++;
      } else {
        sectorData[sector] = 1;
      }

      // Add shares data
      sharesData.push({ symbol: symbol, shares: sharesOutstanding });

      // Update charts
      updateCharts();
      addStockToList(symbol);
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
}

function updateCharts() {
  // Update currency chart
  const currencyChart = document.getElementById('currencyChart');
  updateBarChart(currencyChart, currencyData, 'Currency Distribution');

  // Update sector chart
  const sectorChart = document.getElementById('sectorChart');
  updateBarChart(sectorChart, sectorData, 'Sector Distribution');

  // Update shares chart
  const sharesChart = document.getElementById('sharesChart');
  updateBarChart(sharesChart, sharesData, 'Shares of Each Company', 'symbol', 'shares');
}

function updateBarChart(chartElement, data, title, xKey = null, yKey = 'value') {
  const width = 600;
  const height = 400;
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };

  const keys = Object.keys(data);

  const xScale = d3.scaleBand()
    .domain(keys)
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(Object.values(data))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const svg = d3.select(chartElement)
    .attr("width", width)
    .attr("height", height);

  svg.selectAll("*").remove(); // Clear existing content

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .text(title);

  const xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickSizeOuter(0));

  const yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(null, "s"))
    .call(g => g.select(".domain").remove());

  svg.append("g").call(xAxis);
  svg.append("g").call(yAxis);

  svg.selectAll("rect")
    .data(keys)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d))
    .attr("y", d => yScale(data[d]))
    .attr("width", xScale.bandwidth())
    .attr("height", d => yScale(0) - yScale(data[d]));
}

function addStockToList(symbol) {
  const stockList = document.getElementById('stockList');
  const li = document.createElement('li');
  li.textContent = symbol;
  const button = document.createElement('button');
  button.textContent = 'Remove';
  button.addEventListener('click', function() {
    removeStockFromList(symbol);
  });
  li.appendChild(button);
  stockList.appendChild(li);
}

function removeStockFromList(symbol) {
  const stockList = document.getElementById('stockList');
  const items = stockList.getElementsByTagName('li');
  for (let i = 0; i < items.length; i++) {
    if (items[i].textContent === symbol) {
      stockList.removeChild(items[i]);
      break;
    }
  }
}

document.getElementById('searchButton').addEventListener('click', function() {
  const symbol = document.getElementById('symbolInput').value.trim().toUpperCase();
  if (symbol !== '') {
    fetchData(symbol);
    document.getElementById('symbolInput').value = ''; // Clear input after search
  } else {
    alert('Please enter a valid stock symbol.');
  }
});
