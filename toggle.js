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
} from "https://unpkg.com/three@0.125.1/build/three.module.js";
import { WEBGL } from "https://unpkg.com/three@0.125.1/examples/jsm/WebGL.js";
import { TrackballControls } from "https://unpkg.com/three@0.125.1/examples/jsm/controls/TrackballControls.js";

if (!WEBGL.isWebGLAvailable()) alert(WEBGL.getWebGLErrorMessage());

let renderer = undefined;
let scene = undefined;
let camera = undefined;
let controls = undefined;
let container = undefined;
let borus = undefined;

function init(container_) {
  container = container_;

  // renderer
  renderer = new WebGLRenderer({
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xffffff, 1.0);
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  container.appendChild(renderer.domElement);

  // scene
  scene = new Scene();
  scene.background = new Color(0xffffff);

  // camera
  const fov = 45.0;
  const aspect = container.offsetWidth / container.offsetHeight;
  const near = 0.01;
  const far = 1000;
  const eyeZ = 3.5;
  camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = eyeZ;

  // lights
  const ambient = new AmbientLight(0xffffff, 0.35);
  camera.add(ambient);
  const point = new PointLight(0xffffff);
  point.position.set(2, 20, 15);
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
  const geo = new TorusGeometry(10, 3, 16, 100);

  // Texture
  const tex = new CanvasTexture(document.getElementById("toggle-texture"));
  const mat = new MeshPhongMaterial({
    map: tex,
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
  render();
}

function drawOnCanvas() {
  const canvas = document.getElementById("toggle-texture");
  const ctx = canvas.getContext("2d");
  ctx.canvas.width = canvas.offsetWidth;
  ctx.canvas.height = canvas.offsetHeight;
  ctx.fillStyle = "#eef";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.beginPath();
  ctx.lineWidth = 15;
  ctx.arc(500, 500, 490, 0, 2 * Math.PI);
  ctx.stroke();
}

drawOnCanvas();

console.log(document.getElementById("three-view"));
init(document.getElementById("three-view"));
animate();
