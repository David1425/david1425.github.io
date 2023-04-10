// Canvas setup
let WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
let ID = 0;

let app = new PIXI.Application({
	width: WIDTH*0.95,
	height: HEIGHT*0.95,
	antialias: true
});
globalThis.__PIXI_APP__ = app;
document.body.appendChild(app.view);

app.renderer.background.color = 0xEEEEEE;
app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;

let cursorMode = 'move';
let selected = null;

function clearCursorMode() {
	if (selected) {
		selected.tint = 0xFFFFFF;
		selected = null;
	}
}

const MAX_BONDS = {
	C: 4,
	H: 1,
	N: 3,
	O: 2,
	F: 1,
	Cl: 1,
	Br: 1
};

let atoms = [], bonds = [];

// Bond creation
function addBond(u, v) {
	if (u.bonded == MAX_BONDS[u.element] || v.bonded == MAX_BONDS[v.element]) {
		console.log("Bond limit reached");
		return;
	}

	if (atoms.indexOf(u) > atoms.indexOf(v)) [u,v] = [v,u];
	for (let i = 0; i < bonds.length; i++) {
		if (bonds[i][0] == u && bonds[i][1] == v) {
			if (bonds[i][2] == 3) {
				console.log("already triple bonded");
			} else {
				bonds[i][2]++;
				u.bonded++;
				v.bonded++;
			}
			return;
		}
	}
	bonds.push([u,v,1]);
	u.bonded++;
	v.bonded++;
}

// Atom creation
function newAtom(element, x, y, bg=0xFFFFFF) {
	let frame = new PIXI.Graphics();
	frame.beginFill(0xFFFFFF);
	frame.drawCircle(0,0,30);
	frame.endFill();
	frame.tint = bg;

	let mask = new PIXI.Graphics();
	mask.beginFill(0xFFFFFF);
	mask.drawCircle(0,0,30);
	mask.endFill();

	let atomContainer = new PIXI.Container();
	atomContainer.mask = mask;
	atomContainer.addChild(mask);

	frame.addChild(atomContainer);

	let text = new PIXI.Text(element, {fontSize: 30});
	text.anchor.set(0.5,0.5);
	atomContainer.addChild(text);

	frame.position.set(x,y);

	frame.element = element;
	frame.bonded = 0;

	frame.eventMode = 'static';
	frame.cursor = 'pointer';

	let down = false;
	frame.on('pointerover', () => {
		frame.tint = 0xDDDDDD;
	});

	frame.on('pointerdown', (event) => {
		if (cursorMode == 'move') {
			down = true;
			app.stage.on('pointermove', (event) => {
				frame.position.set(event.globalX, Math.min(app.screen.height-80, event.globalY));
			});
		}
	});

	app.stage.on('pointerup', () => {
		if (cursorMode == 'move') {
			down = false;
			app.stage.off('pointermove');
		}
	});

	app.stage.on('pointerupoutside', () => {
		if (cursorMode == 'move') {
			down = false;
			app.stage.off('pointermove');
		}
	});

	frame.on('pointertap', () => {
		if (cursorMode == 'bond') {
			if (selected == null) {
				selected = frame;
				selected.tint = 0xDDDDDD;
			} else if (selected == frame) {
				selected.tint = 0xFFFFFF;
				selected = null;
			} else {
				console.log(selected.x + ' ' + selected.y);
				console.log(frame.x + ' ' +  frame.y);
				addBond(selected, frame);
				selected.tint = 0xFFFFFF;
				selected = null;
			}
		}
	});

	frame.on('pointerout', () => {
		if (!down) frame.tint = bg;
		if (selected == frame) frame.tint = 0xDDDDDD;
	});

	return frame;
}

// Rendering
let atomsContainer = new PIXI.Container();
let bondsContainer = new PIXI.Container();
app.stage.addChild(bondsContainer);
app.stage.addChild(atomsContainer);

function atomRender() {
	atomsContainer.removeChildren();
	for (let i = 0; i < atoms.length; i++) {
		atomsContainer.addChild(atoms[i]);
	}
}

function bondRender() {
	bondsContainer.removeChildren();
	for (let i = 0; i < bonds.length; i++) {
		let [u,v,c] = bonds[i];
		let bond = new PIXI.Graphics();
		let d = Math.sqrt((u.x-v.x)*(u.x-v.x) + (u.y-v.y)*(u.y-v.y));
		bond.lineStyle(3);
		if (c == 1 || c == 3) {
			bond.moveTo(u.x, u.y);
			bond.lineTo(v.x, v.y);
		}
		if (c == 2) {
			bond.moveTo(u.x+5*(v.y-u.y)/d, u.y+5*(u.x-v.x)/d);
			bond.lineTo(v.x+5*(v.y-u.y)/d, v.y+5*(u.x-v.x)/d);
			bond.moveTo(u.x-5*(v.y-u.y)/d, u.y-5*(u.x-v.x)/d);
			bond.lineTo(v.x-5*(v.y-u.y)/d, v.y-5*(u.x-v.x)/d);
		}
		if (c == 3) {
			bond.moveTo(u.x+10*(v.y-u.y)/d, u.y+10*(u.x-v.x)/d);
			bond.lineTo(v.x+10*(v.y-u.y)/d, v.y+10*(u.x-v.x)/d);
			bond.moveTo(u.x-10*(v.y-u.y)/d, u.y-10*(u.x-v.x)/d);
			bond.lineTo(v.x-10*(v.y-u.y)/d, v.y-10*(u.x-v.x)/d);
		}
		bondsContainer.addChild(bond);
	}
}

// UI
let ui = new PIXI.Container();
app.stage.addChild(ui);

function elementButton(text, x, y, w, h) {
	let btn = new PIXI.Graphics();
	btn.beginFill(0xFBFBFB);
	btn.drawRect(0,0,w,h);
	btn.endFill();

	let cont = new PIXI.Container();
	btn.addChild(cont);

	let txt = new PIXI.Text(text, {fontSize: 40});
	txt.anchor.set(0.5,0.5);
	txt.position.set(w/2, h/2);
	cont.addChild(txt);
	btn.position.set(x,y);

	btn.eventMode = 'static';
	btn.cursor = 'pointer';

	btn.on('pointerover', () => {
		btn.tint= 0xDDDDDD;
	});

	btn.on('pointertap', () => {
		atoms.push(newAtom(text,300+Math.random()*600,300+Math.random()*400));
	});

	btn.on('pointerout', () => {
		btn.tint = 0xFFFFFF;
	});

	return btn;
}

function bondButton(text, x, y, w, h, add=true) {
	let btn = new PIXI.Graphics();
	btn.beginFill(0xFBFBFB);
	btn.drawRect(0,0,w,h);
	btn.endFill();

	let cont = new PIXI.Container();
	btn.addChild(cont);

	let txt = new PIXI.Text(text, {fontSize: 30});
	txt.anchor.set(0.5,0.5);
	txt.position.set(w/2, h/2);
	cont.addChild(txt);
	btn.position.set(x,y);

	btn.eventMode = 'static';
	btn.cursor = 'pointer';

	btn.on('pointerover', () => {
		btn.tint= 0xDDDDDD;
	});

	btn.on('pointertap', () => {
		clearCursorMode();
		if (cursorMode != 'bond') {
			cursorMode = 'bond';
			btn.tint = 0xDDDDDD;
		} else {
			cursorMode = 'move';
		}
	});

	btn.on('pointerout', () => {
		btn.tint = 0xFFFFFF;
		if (cursorMode == 'bond') btn.tint = 0xDDDDDD;
	});

	return btn;
}

ui.addChild(elementButton('C',50,app.screen.height-50,100,50));
ui.addChild(elementButton('H',150,app.screen.height-50,100,50));
ui.addChild(elementButton('N',250,app.screen.height-50,100,50));
ui.addChild(elementButton('O',350,app.screen.height-50,100,50));
ui.addChild(elementButton('F',450,app.screen.height-50,100,50));
ui.addChild(elementButton('Cl',550,app.screen.height-50,100,50));
ui.addChild(elementButton('Br',650,app.screen.height-50,100,50));
ui.addChild(bondButton('Add Bond',app.screen.width-250,app.screen.height-50,200,50));

let elapsed = 0.0, atomCount = 0, bondCount = 0;
app.ticker.add((delta) => {
	elapsed += delta;

	if (atomCount != atoms.length) {
		atomRender();
		atomCount = atoms.length;
	}
	bondRender();
});
