import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, Sparkles, BookOpen, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
        () => ["Analogies", "Synonyms", "Reading", "Verbal Mastery", "Knowledge"],
        []
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 3000);
        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    return (
        <div className="w-full relative overflow-hidden bg-[#fafaf8]">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[#fafaf8]" />
                <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-500/[0.08] rounded-full blur-[140px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-500/[0.05] rounded-full blur-[120px] animate-blob animation-delay-2000" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fafaf8]" />
            </div>

            <div className="container mx-auto px-4">
                <div className="flex gap-8 py-24 lg:py-40 items-center justify-center flex-col">
                    <div className="flex gap-6 flex-col w-full items-center">
                        <h1 className="text-5xl md:text-7xl max-w-4xl mx-auto tracking-tighter text-center font-black text-slate-900 leading-[0.9] flex flex-col items-center">
                            <span className="block mb-4 italic">Master Your</span>
                            <span className="relative flex w-full justify-center items-center overflow-hidden text-center h-[1.2em] text-indigo-600 italic">
                                &nbsp;
                                {titles.map((title, index) => (
                                    <motion.span
                                        key={index}
                                        className="absolute w-full flex justify-center items-center text-center"
                                        initial={{ opacity: 0, y: "150%" }}
                                        transition={{ type: "spring", stiffness: 35, damping: 12 }}
                                        animate={
                                            titleNumber === index
                                                ? { y: 0, opacity: 1 }
                                                : { y: titleNumber > index ? "-150%" : "150%", opacity: 0 }
                                        }
                                    >
                                        {title}
                                    </motion.span>
                                ))}
                            </span>
                        </h1>

                        <p className="text-base md:text-lg leading-relaxed tracking-tight text-slate-600 max-w-xl mx-auto text-center font-medium">
                            A focused, high-precision vocabulary system designed for students preparing for the SSAT verbal section.
                        </p>
                    </div>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-3 mt-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <Button size="lg" className="gap-3 h-12 px-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg text-sm font-bold transition-all active:scale-95" onClick={() => window.location.href = '/signup'}>
                            Sign Up Free <MoveRight className="w-4 h-4" />
                        </Button>
                        <Button size="lg" variant="outline" className="gap-3 h-12 px-8 rounded-lg border-2 border-slate-200 hover:bg-slate-50 text-sm font-bold transition-all active:scale-95 text-slate-700" onClick={() => window.location.href = '/signin'}>
                            Login
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export { Hero };
