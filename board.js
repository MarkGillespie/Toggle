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
  Mesh,
  RepeatWrapping,
  TextureLoader,
  DoubleSide,
} from "https://unpkg.com/three@0.125.1/build/three.module.js";
import { WEBGL } from "https://unpkg.com/three@0.125.1/examples/jsm/WebGL.js";
import { TrackballControls } from "https://unpkg.com/three@0.125.1/examples/jsm/controls/TrackballControls.js";
import { OBJLoader } from "https://unpkg.com/three@0.125.1/examples/jsm/loaders/OBJLoader.js";

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
const canvas = document.createElement("canvas");
canvas.width = 10;
canvas.height = canvas.width;
const background_image = new Image();
background_image.src = "./img/wood-color.jpg";
background_image.loaded = false;

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
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  const mat = new MeshPhongMaterial({
    map: tex,
    shininess: 0.25,
    transparent: true,
    alphaTest: 0.5,
    side: DoubleSide,
  });

  const loader = new OBJLoader();
  loader.load("klein.obj", function (obj) {
    borus = obj.children[0];
    console.log(obj);
    borus.material = mat;
    scene.add(borus);
  });
  // borus = new Mesh(geo, mat);
  // scene.add(borus);
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

  if (borus && borus.geometry) {
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
  }

  render();
}

// Only works if background image has been loaded
function unsafeDrawBoard(num_columns, num_rows, board_letters) {
  // Make canvas really big to get crisp fonts
  canvas.width = 5000;
  canvas.height = canvas.width;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#eef";

  const bigFont = Math.floor(canvas.width / (num_rows + 3));
  const smallFont = Math.floor(bigFont * 0.6);
  const lineWeight = Math.floor(0.003 * canvas.width);

  // ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  ctx.drawImage(background_image, 0, 0, canvas.width / 2, canvas.height / 2);
  ctx.drawImage(
    background_image,
    canvas.width / 2,
    0,
    canvas.width / 2,
    canvas.height / 2
  );
  ctx.drawImage(
    background_image,
    0,
    canvas.height / 2,
    canvas.width / 2,
    canvas.height / 2
  );
  ctx.drawImage(
    background_image,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2,
    canvas.height / 2
  );

  ctx.beginPath();
  ctx.lineWidth = lineWeight;

  const col_w = canvas.width / num_columns;
  const row_h = canvas.height / num_rows;
  for (let i = 0; i < num_columns + 1; i++) {
    ctx.moveTo(i * col_w, 0);
    ctx.lineTo(i * col_w, canvas.height);
    // ctx.clearRect(i * col_w - lineWeight / 2, 0, lineWeight, canvas.height);
  }
  for (let i = 0; i < num_rows + 1; i++) {
    ctx.moveTo(0, i * row_h);
    ctx.lineTo(canvas.width, i * row_h);
    // ctx.clearRect(0, i * row_h - lineWeight / 2, canvas.width, lineWeight);
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
  if (borus) borus.material.map.needsUpdate = true;

  // setTimeout(() => {
  //   canvas.width = 10;
  //   canvas.height = canvas.width;
  // }, 100);

  // ctx.arc(canvas.offsetWidth / 2, canvas.offsetHeight / 2, canvas.offsetHeight / 2 - 20, 0, 2 * Math.PI);
}

// if background image has been loaded, just call unsafeDrawBoard
// Otherwise, wait until the image has been loaded and then make call
function drawBoard(num_columns, num_rows, board_letters) {
  if (background_image.loaded) {
    unsafeDrawBoard(num_columns, num_rows, board_letters);
  } else {
    background_image.addEventListener("load", function () {
      unsafeDrawBoard(num_columns, num_rows, board_letters);
    });
  }
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

background_image.addEventListener(
  "load",
  function () {
    background_image.loaded = true;

    // Broken :'(
    // shift(0, 3, 10, 10);
    animate();
  },
  false
);

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

export { drawBoard };
