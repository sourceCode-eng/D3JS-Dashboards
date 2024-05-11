// Initialize an array to store company symbols and gross profits
let companies = [];

// Function to fetch data from the API
async function fetchData(symbol) {
  const apiKey = '5mxfZ6xaNFhgpQvJOVwzTFUxFbF0aFVw'; // Replace 'demo' with your actual API key
  const apiUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;

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

// Function to add a new company to the chart
async function addCompany() {
  const symbolInput = document.getElementById('symbol');
  const symbol = symbolInput.value.trim().toUpperCase();
  
  // Check if symbol already exists in the list
  if (companies.includes(symbol)) {
    alert('Company symbol already added!');
    return;
  }

  // Fetch data for the symbol
  const data = await fetchData(symbol);
  if (data) {
    const grossProfitTTM = parseFloat(data.GrossProfitTTM);
    if (!isNaN(grossProfitTTM)) {
      // Add symbol and gross profit to the companies array
      companies.push({
        name: symbol,
        value: grossProfitTTM
      });

      // Update the pie chart
      updateChart();
    } else {
      alert('Gross Profit TTM data not available for the company.');
    }
  } else {
    alert('Failed to fetch data for the company.');
  }

  // Clear input field
  symbolInput.value = '';
}

// Function to remove a company from the chart
function removeCompany(symbol) {
  companies = companies.filter(company => company.name !== symbol);
  updateChart();
}

// Function to update the pie chart
function updateChart() {
  const width = 500;
  const height = 500;
  const radius = Math.min(width, height) / 2;

  const arc = d3.arc()
    .innerRadius(radius * 0.67)
    .outerRadius(radius - 1);

  const pie = d3.pie()
    .padAngle(1 / radius)
    .sort(null)
    .value(d => d.value);

  const color = d3.scaleOrdinal()
    .domain(companies.map(d => d.name))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), companies.length).reverse());

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  svg.append("g")
    .selectAll()
    .data(pie(companies))
    .join("path")
    .attr("fill", d => color(d.data.name))
    .attr("d", arc)
    .append("title")
    .text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`);

  svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .selectAll()
    .data(pie(companies))
    .join("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .call(text => text.append("tspan")
      .attr("y", "-0.4em")
      .attr("font-weight", "bold")
      .text(d => d.data.name))
    .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
      .attr("x", 0)
      .attr("y", "0.7em")
      .attr("fill-opacity", 0.7)
      .text(d => d.data.value.toLocaleString("en-US")));

  // Add delete buttons for each company
  const deleteButtons = svg.selectAll()
    .data(pie(companies))
    .join("foreignObject")
    .attr("width", 30)
    .attr("height", 30);

  deleteButtons.append("xhtml:button")
    .text("x")
    .on("click", d => removeCompany(d.data.name));

  // Position delete buttons under the graph
  deleteButtons.attr("x", d => arc.centroid(d)[0] - 15)
    .attr("y", d => arc.centroid(d)[1] + radius + 10);

  document.getElementById('chart').innerHTML = '';
  document.getElementById('chart').appendChild(svg.node());
}


