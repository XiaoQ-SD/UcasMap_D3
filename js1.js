let w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
let h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
w *= 0.98;
h *= 0.90;

let inner = {bottom: 50, top: 50, left: 50, right: 50};
let Data = new Array();
let DataEntry = new Array();
let idx = 20170101, sce = 0;
let ct = 0;
let H = (h - inner.top - inner.bottom);
let W = (w - inner.left - inner.right);

// 添加画布
let svg = d3.select("body")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .append("g");

// 解析csv数据
d3.csv("weather.csv").then(function (d) {
    for (let i = 0; i < d.length; ++i) {
        if (d[i].latitude >= 25 && d[i].latitude <= 55 &&
            d[i].longitude <= -60 && d[i].longitude >= -130)
            Data[ct++] = d[i];
    }

    trans();

    d3.selectAll("body")
        .append("button")
        .attr("type", "button")
        .attr("onclick", 'draw()')
        .text("show total PRCP");

    d3.selectAll("body")
        .append("button")
        .attr("type", "button")
        .attr("onclick", 'move()')
        .text("show dynamic pic");
});

svg.append("text")
    .text("American weather")
    .attr("x", w / 2)
    .attr("y", 30)
    .style("font-size", 25)
    .attr("text-anchor", "middle");

const mon = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30];

function add1day() {
    idx++;
    sce++;
    if (idx > 20170915) {
        idx = 20170101;
        sce = 0;
    }
    let d = idx % 100;
    let m = Math.floor(idx / 100) % 100;
    // console.log(d, m);
    if (d > mon[m]) {
        d = 1;
        m++;
        idx = 2017 * 10000 + d + m * 100;
    }
}

function trans() {
    for (let i = 0; i < Data.length; ++i) {
        Data[i].TMIN = (Data[i].TMIN - 32) / 1.8;
        Data[i].TMAX = (Data[i].TMAX - 32) / 1.8;
        Data[i].TAVG = (Data[i].TAVG - 32) / 1.8;
        Data[i].AWND = Data[i].AWND / 0.6214;
        Data[i].WSF5 = Data[i].WSF5 / 0.6214;
        Data[i].SNOW = Data[i].SNOW * 2.54;
        Data[i].SNWD = Data[i].SNWD * 2.54;
        Data[i].PRCP *= 2.54;
    }
}

function draw() {

    Data.sort(function (a, b) {
        return parseFloat(a.longitude) - parseFloat(b.longitude);
    });

    let A = new Array();
    let ctA = 0;
    for (let i = 0; i < ct; ++i) {
        if (i === 0 || Data[i].station !== Data[i - 1].station) {
            if (i !== 0) {
                ++ctA;
            }
            A[ctA] = new Object();
            A[ctA] = Data[i];
        } else A[ctA].PRCP += Data[i].PRCP;
    }

    console.log(Data);
    console.log(A);

    svg.selectAll("circle")
        .data(A)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return w - inner.right - ((d.longitude * (-1) - 60) / 70) * W;
        })
        .attr("cy", function (d) {
            return h - inner.bottom - ((d.latitude - 25) / 30) * H;
        })
        .attr("r", function (d) {
            return d.PRCP / 10;
        })
        .attr("fill", function (d) {
            return 'rgb(0,0,' + (255 - parseInt(d.WSF5) * 0.5) + ')';
        });

    console.log(d3.max(Data, function (d) {
        return d.PRCP;
    }));
}

function move() {
    Data.sort(function (a, b) {
        if (a.date === b.date) return parseFloat(a.longitude) - parseFloat(b.longitude);
        return parseInt(a.date) - parseInt(b.date);
    });

    console.log(Data);

    let DataEntry = new Array();
    let E = new Array();
    let DataLine = new Array();
    let cnt = 0;
    let ctD = 0;
    for (let i = 0; i < Data.length; ++i) {
        if (i !== 0 && Data[i].date !== Data[i - 1].date) {
            DataEntry[cnt] = new Object();
            DataEntry[cnt] = E;
            E = new Array();
            // console.log(E);
            cnt++;
            ctD = 0;
        }
        E[ctD] = new Object();
        E[ctD] = Data[i];
        ctD++;
    }

    svg.selectAll("ellipse")
        .data(DataEntry[0])
        .enter()
        .append("ellipse")
        .attr("cx", function (d) {
            return w - inner.right - ((d.longitude * (-1) - 60) / 70) * W;
        })
        .attr("cy", function (d) {
            return h - inner.bottom - ((d.latitude - 25) / 30) * H;
        })
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", "white")
        .attr("stroke", "black");

    let comment = svg.append("text")
        .text(function () {
            return idx;
        })
        .attr("x", w - 200)
        .attr("y", h - 150)
        .style("font-size", 40);

    DataLine = DataEntry[sce];

    let circles = svg.selectAll("circle")
        .data(DataLine)
        .enter()
        .append("circle")
        .attr("r", function (d) {
            return 1;
        })
        .attr("cx", function (d) {
            return w - inner.right - (d.longitude * (-1) - 60) / 70 * W;
        })
        .attr("cy", function (d) {
            return h - inner.bottom - (d.latitude - 25) / 30 * H;
        });


    circles.transition()
        .duration(600)
        .attr("r", function (d) {
            return d.PRCP * 5;
        })
        .attr("fill", function (d) {
            return 'rgba(0,' + Math.max(0, (175 - parseInt(d.WSF5))) + ',' + (255) + ',0.8)';
        });

    for (let i = 0; i < cnt; ++i) {
        console.log(DataEntry[i]);
    }

    setInterval(function () {
        add1day();
        update(idx);
    }, 600);

    function update(t) {
        comment.text(idx);
        updateElement();
    }

    function updateElement() {

        svg.selectAll("circle")
            .data(DataEntry[sce], d => d.station)
            .transition()
            .duration(600)
            .attr("r", function (d) {
                return d.PRCP * 5;
            })
            .attr("fill", function (d) {
                return 'rgba(0,' + Math.max(0, (175 - parseInt(d.WSF5))) + ',' + (255) + ',0.8)';
            });
    }
}