'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, children, ...props }: DottedSurfaceProps) {
    const [isDark, setIsDark] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const check = () => {
            const dark = document.documentElement.classList.contains('dark') || document.documentElement.classList.contains('dim');
            setIsDark(dark);
        };
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        const SEPARATION = 150;
        const AMOUNTX = 40;
        const AMOUNTY = 60;

        const scene = new THREE.Scene();
        const fogColor = isDark ? 0x0a0a0a : 0xffffff;
        scene.fog = new THREE.Fog(fogColor, 2000, 10000);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(0, 355, 1220);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(fogColor, 0);
        containerRef.current.appendChild(renderer.domElement);

        const positions: number[] = [];
        const colors: number[] = [];
        const geometry = new THREE.BufferGeometry();

        for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
                positions.push(ix * SEPARATION - (AMOUNTX * SEPARATION) / 2, 0, iy * SEPARATION - (AMOUNTY * SEPARATION) / 2);
                if (isDark) {
                    // Normalized 0.0-1.0 range for Three.js vertexColors
                    colors.push(0.6, 0.6, 0.7);
                } else {
                    colors.push(0.55, 0.55, 0.65);
                }
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 8,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        let count = 0;
        let animationId: number;

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const posArr = (geometry.attributes.position.array as Float32Array);
            let i = 0;
            for (let ix = 0; ix < AMOUNTX; ix++) {
                for (let iy = 0; iy < AMOUNTY; iy++) {
                    posArr[i * 3 + 1] = Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50;
                    i++;
                }
            }
            geometry.attributes.position.needsUpdate = true;
            renderer.render(scene, camera);
            count += 0.1;
        };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            scene.traverse((obj) => {
                if (obj instanceof THREE.Points) {
                    obj.geometry.dispose();
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                    else obj.material.dispose();
                }
            });
            renderer.dispose();
            if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, [isDark]);

    return (
        <div
            ref={containerRef}
            suppressHydrationWarning
            className={cn('pointer-events-none fixed inset-0', className)}
            style={{ zIndex: 0 }}
            {...props}
        >
            {children}
        </div>
    );
}
