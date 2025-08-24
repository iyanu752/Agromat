// import Plant from '../../assets/plant.png';
// import nameText from '../../assets/namelogo.png';
import Plant from '../assets/plant.png'
import nameText from '../assets/namelogo.png'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

function LandingAnimation() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Mouse tracking
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);
    

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springX = useSpring(x, { stiffness: 50, damping: 20 });
    const springY = useSpring(y, { stiffness: 50, damping: 20 });

    // Parallax effect
    useEffect(() => {
        x.set((mousePosition.x - window.innerWidth / 2) / 50);
        y.set((mousePosition.y - window.innerHeight / 2) / 50);
    }, [mousePosition, x, y]);

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-visible">
            {/* Floating text */}
            <motion.img
    src={nameText}
    alt="Agromat text"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    style={{
        x: springX,
        y: springY,
    }}
    className="relative z-10 w-2/3 max-w-xs pointer-events-none"
/>

<motion.img
    src={Plant}
    alt="plant"
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1.2, delay: 0.5 }}
    style={{
        x: useTransform(springX, (val) => val * -1),
        y: useTransform(springY, (val) => val * -1),
    }}
    className="absolute top-0 left-0 w-full h-full object-contain z-20 pointer-events-none"
/>

        </div>
    );
}

export default LandingAnimation;
