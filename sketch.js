let table;
let rivers = [];
let continenti = ["Africa", "South America", "North America", "Asia", "Europe", "Oceania"];

// Carico i dati nel setup
async function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  textFont("Futura, sans-serif");

  table = await loadTable("assets/rivers.csv", ",", "header");

  // Salvo ogni riga come oggetto nell'array
  for (let i = 0; i < table.getRowCount(); i++) {
    let cont = table.getString(i, "continent");
    if (cont === "Australia") {
      cont = "Oceania";
    }

    let fiume = {
      name: table.getString(i, "name"),
      continent: cont,
      length: table.getNum(i, "length"),
      area: table.getNum(i, "area"),
      discharge: table.getNum(i, "discharge"),
      tributaries: table.getNum(i, "tributaries"),
      temp: table.getNum(i, "avg_temp")
    };
    rivers.push(fiume);
  }

  // Ordino per continente e, all'interno di ogni gruppo, per lunghezza decrescente
  rivers.sort((a, b) => {
    let diff = continenti.indexOf(a.continent) - continenti.indexOf(b.continent);
    if (diff !== 0) {
      return diff;
    }
    return b.length - a.length;
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(255);
  if (rivers.length === 0) {
    return;
  }

  let plotWidth = max(0, min(1200, width - 60));
  let plotLeft = (width - plotWidth) / 2;
  let plotRight = plotLeft + plotWidth;
  let yBase = min(660, height - 155);
  let plotHeight = min(440, yBase - 190);

  // Disegno il titolo
  fill(30);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(22);
  textStyle(BOLD);
  text("RIVER SKYLINE", 35, 32);

  fill(130);
  textSize(11);
  textStyle(NORMAL);
  text("Skyline dei 100 fiumi più grandi sulla Terra", 35, 60);

  // Disegno le linee di riferimento per la lunghezza (2000, 4000 e 6000 km)
  let xLinee = plotLeft + 40;
  stroke(230);
  strokeWeight(0.8);
  fill(145);
  textSize(8.5);
  textAlign(RIGHT, CENTER);

  let quote = [2000, 4000, 6000];
  for (let i = 0; i < quote.length; i++) {
    let km = quote[i];
    let qY = yBase - map(km, 0, 7000, 0, plotHeight);
    line(xLinee, qY, plotRight, qY);
    noStroke();
    text(km + " km", xLinee - 10, qY);
    stroke(230);
  }

  // Disegno la linea di base
  stroke(180);
  strokeWeight(1.2);
  line(xLinee, yBase, plotRight, yBase);

  // Calcolo la posizione dei fiumi e lo spazio tra i continenti
  let xStart = plotLeft + 50;
  let xEnd = plotRight - 50;
  let continentCount = 0;
  let previousContinent = "";
  for (let i = 0; i < rivers.length; i++) {
    if (rivers[i].continent !== previousContinent) {
      continentCount++;
      previousContinent = rivers[i].continent;
    }
  }
  let continentGaps = max(0, continentCount - 1);
  let gapContinent = min(22, max(0, (xEnd - xStart) / max(1, continentCount)));
  let dx = rivers.length > 1
    ? (xEnd - xStart - continentGaps * gapContinent) / (rivers.length - 1)
    : 0;
  let posX = xStart;
  let currCont = "";
  let hovered = null;

  for (let i = 0; i < rivers.length; i++) {
    let r = rivers[i];

    // Scrivo il nome del continente quando inizia un nuovo gruppo
    if (r.continent !== currCont) {
      if (currCont !== "") {
        posX += gapContinent;
      }
      currCont = r.continent;
      noStroke();
      fill(120);
      textSize(8.5);
      textStyle(BOLD);
      textAlign(LEFT, BOTTOM);
      text(currCont.toUpperCase(), posX, yBase - plotHeight - 20);
    }

    let h = map(r.length, 70, 7000, 10, plotHeight);

    // Controllo se il mouse si trova sopra il fiume
    if (abs(mouseX - posX) < 5 && mouseY >= yBase - h - 10 && mouseY <= yBase) {
      hovered = r;
    }

    disegnaGlifo(r, posX, yBase, h, hovered === r);
    posX += dx;
  }

  disegnaLegenda((width - min(plotWidth, width - 40)) / 2, yBase + 22, min(plotWidth, width - 40));

  // Disegno le informazioni del fiume selezionato
  if (hovered !== null) {
    disegnaTooltip(hovered);
  }
}

// Disegna il glifo di un fiume
function disegnaGlifo(r, x, y, h, isHover) {
  push();
  translate(x, y);

  // Calcolo il colore in base alla temperatura
  let cBlu = color(30, 130, 220);
  let cRosso = color(230, 60, 40);
  let tNorm = constrain(map(r.temp, -8, 28, 0, 1), 0, 1);
  let col = lerpColor(cBlu, cRosso, tNorm);

  // Disegno lo stelo con spessore proporzionale alla portata
  stroke(col);
  let spessore = map(sqrt(r.discharge), 0, sqrt(210000), 1.2, 4.8);
  if (isHover) {
    spessore = spessore * 1.4;
  }
  strokeWeight(spessore);
  line(0, 0, 0, -h);

  // Disegno i rametti che rappresentano gli affluenti
  strokeWeight(0.9);
  let rami = int(map(sqrt(r.tributaries), 0, sqrt(1100), 2, 12));
  let passo = h / (rami + 1);
  for (let k = 1; k <= rami; k++) {
    let yr = -k * passo;
    let dir = (k % 2 === 0) ? 4 : -4;
    line(0, yr, dir, yr - 3);
  }

  // Disegno l'anello con dimensione proporzionale al bacino
  noFill();
  stroke(col);
  strokeWeight(isHover ? 1.4 : 0.85);
  let diametro = map(sqrt(r.area), 0, sqrt(7050000), 4, 18);
  circle(0, -h, diametro);
  pop();
}

// Disegna la legenda sotto il grafico
function disegnaLegenda(lx, ly, lw) {
  let lh = 125;
  fill(250);
  stroke(225);
  rect(lx, ly, lw, lh, 6);

  noStroke();
  fill(30);
  textSize(10);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text("LEGENDA DEL GLIFO", lx + lw / 2, ly + 8);

  let voci = [
    ["ALTEZZA", "Lunghezza (km)"],
    ["SPESSORE", "Portata media"],
    ["RAMI", "Affluenti principali"],
    ["ANELLO", "Superficie del bacino"],
    ["COLORE", "Temperatura media"]
  ];
  let colW = lw / voci.length;
  textAlign(CENTER, TOP);
  for (let i = 0; i < voci.length; i++) {
    let cx = lx + colW * (i + 0.5);
    fill(55);
    textSize(8);
    textStyle(BOLD);
    text(voci[i][0], cx, ly + 26);
    fill(100);
    textSize(7.5);
    textStyle(NORMAL);
    text(voci[i][1], cx, ly + 39);
  }

  // Disegno la scala dei colori della temperatura
  let barW = lw - 28;
  let barY = ly + 61;
  let cBlu = color(30, 130, 220);
  let cRosso = color(230, 60, 40);
  for (let b = 0; b < barW; b++) {
    stroke(lerpColor(cBlu, cRosso, b / barW));
    line(lx + 14 + b, barY, lx + 14 + b, barY + 8);
  }

  noStroke();
  fill(120);
  textSize(8);
  textAlign(LEFT, TOP);
  text("Fredda (-7.5°C)", lx + 14, barY + 10);
  textAlign(RIGHT, TOP);
  text("Calda (+27.5°C)", lx + 14 + barW, barY + 10);
  textAlign(CENTER, TOP);
  text("Passa il mouse sopra uno stelo per leggere la scheda completa.", lx + lw / 2, ly + 106);
}

// Disegna il tooltip con le informazioni del fiume
function disegnaTooltip(r) {
  let tw = 225;
  let th = 92;
  let tx = constrain(mouseX + 15, 10, width - tw - 15);
  let ty = constrain(mouseY - 95, 10, height - th - 15);

  fill(255);
  stroke(200);
  rect(tx, ty, tw, th, 6);

  // Accorcio il nome se supera i 25 caratteri
  let nome = r.name;
  if (nome.length > 25) {
    nome = nome.substring(0, 22) + "...";
  }

  noStroke();
  textAlign(LEFT, TOP);
  fill(20);
  textStyle(BOLD);
  textSize(10.5);
  text(nome, tx + 12, ty + 10);

  textStyle(NORMAL);
  fill(90);
  textSize(9);
  let info = r.continent + "\n" +
             "Lunghezza: " + r.length + " km\n" +
             "Portata: " + r.discharge + " m³/s\n" +
             "Bacino: " + round(r.area / 1000) + "k km² (" + r.tributaries + " affl.)\n" +
             "Temperatura: " + r.temp + " °C";

  text(info, tx + 12, ty + 26);
}