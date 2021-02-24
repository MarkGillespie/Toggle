import {
  WebGLRenderer,
  Scene,
  Color,
  PerspectiveCamera,
  AmbientLight,
  PointLight,
  TorusGeometry,
  CanvasTexture,
  MeshPhongMaterial,
  ShaderMaterial,
  Mesh,
  RepeatWrapping,
  TextureLoader,
  ImageUtils,
  ShaderLib,
} from "https://unpkg.com/three@0.125.1/build/three.module.js";
import { WEBGL } from "https://unpkg.com/three@0.125.1/examples/jsm/WebGL.js";
import { TrackballControls } from "https://unpkg.com/three@0.125.1/examples/jsm/controls/TrackballControls.js";

import { find_all_matches } from "./find_words.js";

if (!WEBGL.isWebGLAvailable()) alert(WEBGL.getWebGLErrorMessage());

let renderer = undefined;
let scene = undefined;
let camera = undefined;
let controls = undefined;
let container = undefined;
let borus = undefined;
let left_pressed = 0;
let right_pressed = 0;
let up_pressed = 0;
let down_pressed = 0;

// Initialize the canvas to be tiny. We'll resize it later once our image loads
// But this makes the creation of our initial CanvasTexture much faster
const textCanvas = document.createElement("canvas");
textCanvas.width = 10;
textCanvas.height = textCanvas.width;
const selectionCanvas = document.createElement("canvas");
selectionCanvas.width = 10;
selectionCanvas.height = selectionCanvas.width;

function init(container_) {
  container = container_;

  // renderer
  renderer = new WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xffffff, 0.0);
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  container.appendChild(renderer.domElement);

  // scene
  scene = new Scene();

  // camera
  const fov = 45.0;
  const aspect = container.offsetWidth / container.offsetHeight;
  const near = 0.01;
  const far = 1000;
  const eyeZ = 50;
  camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = eyeZ;

  // lights
  const ambient = new AmbientLight(0xffffff, 0.35);
  camera.add(ambient);
  const point = new PointLight(0xffffff);
  point.position.set(2, 20, 5);
  camera.add(point);

  scene.add(camera);

  // controls
  controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 5.0;

  // events
  window.addEventListener("resize", () => {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.offsetWidth, container.offsetHeight);
    controls.handleResize();
    render();
  });

  // Torus mesh
  const geo = new TorusGeometry(10, 7, 100, 100);

  // Texture
  const tText = new CanvasTexture(textCanvas);
  tText.wrapS = RepeatWrapping;
  tText.wrapT = RepeatWrapping;
  const tSelection = new CanvasTexture(selectionCanvas);
  tSelection.wrapS = RepeatWrapping;
  tSelection.wrapT = RepeatWrapping;

  const tWood = ImageUtils.loadTexture("./img/wood-color.jpg");
  tWood.wrapS = RepeatWrapping;
  tWood.wrapT = RepeatWrapping;

  const mat = new ShaderMaterial({
    uniforms: {
      tWood: {
        type: "t",
        value: tWood,
      },
      tText: {
        type: "t",
        value: tText,
      },
      tSelection: {
        type: "t",
        value: tSelection,
      },
    },
    vertexShader: `
varying vec2 vUv;
varying vec3 vNormal;
void main()
{
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    vNormal = normalize( mat3( modelViewMatrix ) * normal );
    gl_Position = projectionMatrix * mvPosition;
}`,
    fragmentShader: `
uniform sampler2D tWood;
uniform sampler2D tText;
uniform sampler2D tSelection;
uniform float shininess;

varying vec2 vUv;
varying vec3 vNormal;

void main(void)
{
    vec3 c;
    vec4 cText = texture2D(tText, vUv);
    vec4 cWood = texture2D(tWood, vUv);
    vec4 cSelection = texture2D(tSelection, vUv);

    c = cText.rgb * cText.a + cSelection.rgb * cSelection.a * (1.- cText.a) + cWood.rgb * (1.-cText.a) * (1.-cSelection.a);

    float specularStrength = min(normalize(vNormal).z + 0.25, 1.5);
	gl_FragColor = vec4( c*specularStrength, 1. );
}
`,
  });
  borus = new Mesh(geo, mat);
  scene.add(borus);
}

function render() {
  // set viewport and render mesh
  let width = container.offsetWidth;

  renderer.setViewport(0.0, 0.0, width, container.offsetHeight);
  renderer.setScissor(0.0, 0.0, width, container.offsetHeight);
  renderer.setScissorTest(true);
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();

  const uv = borus.geometry.attributes.uv.array;
  const num_points = uv.length / 2;
  const scrolling_horizontal = right_pressed - left_pressed;
  const scrolling_vertical = up_pressed - down_pressed;
  for (let i = 0; i < num_points; i++) {
    uv[2 * i] -= scrolling_horizontal * 0.005;
    uv[2 * i + 1] -= scrolling_vertical * 0.005;
  }
  borus.geometry.attributes.uv.needsUpdate =
    scrolling_horizontal != 0 || scrolling_vertical != 0;

  render();
}

// Only works if background image has been loaded
function drawBoard(num_columns, num_rows, board_letters) {
  // Make canvas really big to get crisp fonts
  textCanvas.width = 2000;
  textCanvas.height = textCanvas.width;

  const w = textCanvas.width;
  const h = textCanvas.height;

  const ctx = textCanvas.getContext("2d");

  const bigFont = Math.floor(w / (num_rows + 3));
  const smallFont = Math.floor(bigFont * 0.6);
  const lineWeight = Math.floor(0.003 * w);

  ctx.beginPath();
  ctx.lineWidth = lineWeight;

  const col_w = w / num_columns;
  const row_h = h / num_rows;
  for (let i = 0; i < num_columns + 1; i++) {
    ctx.moveTo(i * col_w, 0);
    ctx.lineTo(i * col_w, h);
  }
  for (let i = 0; i < num_rows + 1; i++) {
    ctx.moveTo(0, i * row_h);
    ctx.lineTo(w, i * row_h);
  }
  ctx.stroke();

  ctx.lineWidth = lineWeight;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let counter = 0;

  for (let i = 0; i < num_rows; i++) {
    for (let j = 0; j < num_columns; j++) {
      let letter = board_letters[counter].toUpperCase();
      ctx.font = bigFont + "px Carrois Gothic";
      if ("Q" == letter) {
        letter = "Qu";
        ctx.font = smallFont * "px Carrois Gothic";
      }
      ctx.fillText(letter, (j + 0.5) * col_w, (i + 0.5) * row_h);
      if ("MWNZ".includes(letter)) {
        ctx.moveTo((j + 0.25) * col_w, (i + 0.8) * row_h);
        ctx.lineTo((j + 0.75) * col_w, (i + 0.8) * row_h);
      }

      counter++;
    }
  }
  ctx.stroke();

  if (borus) borus.material.uniforms.tText.value.needsUpdate = true;
}

function drawSelection(num_columns, num_rows, highlighted) {
  selectionCanvas.width = 100;
  selectionCanvas.height = selectionCanvas.width;

  const w = selectionCanvas.width;
  const h = selectionCanvas.height;

  const ctx = selectionCanvas.getContext("2d");

  const col_w = w / num_columns;
  const row_h = h / num_rows;

  ctx.beginPath();
  ctx.fillStyle = "#fe33";
  highlighted.forEach((count) => {
    const i = Math.floor(count / num_columns);
    const j = count % num_columns;
    ctx.fillRect(j * col_w, i * row_h, col_w, row_h);
  });
  ctx.stroke();
  if (borus) borus.material.uniforms.tSelection.value.needsUpdate = true;
}

function highlightString(boardLetters, num_columns, num_rows, str) {
  // const highlighted = [];
  // for (let i = 0; i < boardLetters.length; i++)
  //   if (str.includes(boardLetters[i])) highlighted.push(i);
  const highlighted = find_all_matches(
    boardLetters,
    num_columns,
    num_rows,
    str.replace("QU", "Q")
  );
  drawSelection(num_columns, num_rows, highlighted);
}

// Doesn't work because a weird cut develops
// TODO: define custom uv map with seam?
function shift(n_shift_x, n_shift_y, n_rows, n_cols) {
  const uv = borus.geometry.attributes.uv.array;
  const num_points = uv.length / 2;

  const width = borus.geometry.parameters.radialSegments;
  const height = borus.geometry.parameters.tubularSegments;

  const dx = n_shift_x / n_cols;
  const dy = n_shift_y / n_rows;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = x + y * width;
      const old_x = uv[2 * i];
      const old_y = uv[2 * i + 1];
      uv[2 * i] += old_y * dx;
      uv[2 * i + 1] += old_x * dy;
    }
  }
  borus.geometry.attributes.uv.needsUpdate = true;
}

init(document.getElementById("three-view"));
animate();

window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      left_pressed = 1;
      break;
    case "ArrowRight":
      right_pressed = 1;
      break;
    case "ArrowUp":
      up_pressed = 1;
      break;
    case "ArrowDown":
      down_pressed = 1;
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      left_pressed = 0;
      break;
    case "ArrowRight":
      right_pressed = 0;
      break;
    case "ArrowUp":
      up_pressed = 0;
      break;
    case "ArrowDown":
      down_pressed = 0;
      break;
  }
});

export { drawBoard, highlightString };
