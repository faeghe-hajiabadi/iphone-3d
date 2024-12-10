import React, {
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  ViewerApp,
  AssetManagerPlugin,
  GBufferPlugin,
  ProgressivePlugin,
  TonemapPlugin,
  SSRPlugin,
  SSAOPlugin,
  BloomPlugin,
  GammaCorrectionPlugin,
  addBasePlugins,
  mobileAndTabletCheck,
  CanvasSnipperPlugin,
  AssetManagerBasicPopupPlugin,
} from "webgi";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { useEffect } from "react";
import { scrollAnimation } from "../lib/scroll-animation";

gsap.registerPlugin(ScrollTrigger);

const WebgiViewer = forwardRef((props, ref) => {
  const canvaRef = useRef(null);
  const [viewRef, setViewerRef] = useState(null);
  const [targetRef, setTargetRef] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [positionRef, setPositionRef] = useState(null);
  const canvasContainerRef = useRef(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isMobile, setIsMobile] = useState(null);
  useImperativeHandle(ref, () => ({
    triggerPreview() {
      setPreviewMode(true);
      props.contentRef.current.style.opacity = "0";
      canvasContainerRef.current.style.pointerEvents = "all";

      gsap.to(positionRef, {
        x: 13.04,
        y: -2.01,
        z: 2.29,
        duration: 2,
        onUpdate: () => {
          viewRef.setDirty();
          cameraRef.positionTargetUpdated(true);
        },
      });
      gsap.to(targetRef, { x: 0.11, y: 0.0, z: 0.0, duration: 2 });
      viewRef.scene.activeCamera.setCameraOptions({ controlsEnabled: true });
    },
  }));
  const canvasRef = useRef(null);
  const memoizedScrollAnimation = useCallback(
    (position, target, isMobileOrTablet, onUpdate) => {
      if (position && target && onUpdate) {
        scrollAnimation(position, target, isMobileOrTablet, onUpdate);
      }
    },
    []
  );

  const setupViewer = useCallback(async () => {
    // Initialize the viewer
    const viewer = new ViewerApp({
      canvas: canvasRef.current,
    });
    setViewerRef(viewer);
    const isMobileOrTablet = mobileAndTabletCheck();
    setIsMobile(isMobileOrTablet);

    const camera = viewer.scene.activeCamera;
    const position = camera.position;
    const target = camera.target;
    setCameraRef(camera);
    setPositionRef(position);
    setTargetRef(target);
    const manager = await viewer.addPlugin(AssetManagerPlugin);

    await viewer.addPlugin(GBufferPlugin);
    await viewer.addPlugin(new ProgressivePlugin(32));
    await viewer.addPlugin(new TonemapPlugin(true));
    await viewer.addPlugin(GammaCorrectionPlugin);
    await viewer.addPlugin(SSRPlugin);
    await viewer.addPlugin(SSAOPlugin);
    await viewer.addPlugin(BloomPlugin);

    await addBasePlugins(viewer);
    await viewer.addPlugin(AssetManagerBasicPopupPlugin);
    await viewer.addPlugin(CanvasSnipperPlugin);
    viewer.renderer.refreshPipeline();
    await manager.addFromPath("scene-black.glb");
    viewer.getPlugin(TonemapPlugin).config.clipBackground = true;
    viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: false });
    if (isMobileOrTablet) {
      position.set(-16.7, 1.17, 11.7);
      target.set(0, 1.37, 0);
      props.contentRef.current.className = "mobile-or-tablet";
    }

    window.scrollTo(0, 0);
    let needsUpdate = true;
    const onUpdate = () => {
      needsUpdate = true;
      viewer.setDirty();
    };
    viewer.addEventListener("preFrame", () => {
      if (needsUpdate) {
        camera.positionTargetUpdated(true);
        needsUpdate = false;
      }
    });
    memoizedScrollAnimation(position, target, isMobileOrTablet, onUpdate);
  }, []);

  useEffect(() => {
    setupViewer();
  }, []);

  const handleExit = useCallback(() => {
    props.contentRef.current.style.opacity = "1";
    canvasContainerRef.current.style.pointerEvents = "none";
    viewRef.scene.activeCamera.setCameraOptions({ controlsEnabled: false });

    setPreviewMode(false);
    gsap.to(positionRef, {
      x: !isMobile ? 1.56 : 9.36,
      y: !isMobile ? 5.0 : 10.95,
      z: !isMobile ? 0.01 : 0.09,
      scrollTrigger: {
        trigger: ".display-section",
        start: "top bottom",
        end: "top top",
        scrub: 2,
        immediateRender: false,
      },
      onUpdate: () => {
        viewRef.setDirty();
        cameraRef.positionTargetUpdated(true);
      },
    });
    gsap.to(targetRef, {
      x: !isMobile ? -0.55 : -6.6,
      y: !isMobile ? 0.32 : 0.02,
      z: !isMobile ? 0.0 : -0.06,
      scrollTrigger: {
        trigger: ".display-section",
        start: "top bottom",
        end: "top top",
        scrub: 2,
        immediateRender: false,
      },
    });
  }, [canvasContainerRef, viewRef, positionRef, cameraRef, targetRef]);

  return (
    <div ref={canvasContainerRef} id="webgi-canvas-container">
      <canvas id="webgi-canvas" ref={canvasRef} />
      {previewMode && (
        <button onClick={handleExit} className="button">
          Exit
        </button>
      )}
    </div>
  );
});

export default WebgiViewer;
