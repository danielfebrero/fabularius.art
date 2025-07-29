import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";

interface MagicTextProps {
  originalText: string;
}

export interface MagicTextHandle {
  castSpell: (_targetText: string) => void;
  reset: () => void;
}

export const MagicText = forwardRef<MagicTextHandle, MagicTextProps>(
  ({ originalText }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInitial, setIsInitial] = useState(true);

    const splitText = useCallback(
      (text: string) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          text.split("").forEach((char, index) => {
            const span = document.createElement("span");
            span.classList.add("letter");
            span.textContent = char === " " ? "\u00A0" : char;
            if (text === originalText && isInitial) {
              span.classList.add("initial-magic");
              span.style.animationDelay = `${index * 0.1}s`;
            }
            containerRef.current!.appendChild(span);
          });
        }
      },
      [originalText, isInitial]
    );

    const reset = () => {
      setIsInitial(true);
    };

    const castSpell = (targetText: string) => {
      if (!containerRef.current || !targetText) return;
      const letters = containerRef.current.querySelectorAll(
        ".letter"
      ) as NodeListOf<HTMLSpanElement>;

      if (isInitial) {
        setIsInitial(false);
      }

      // Remove initial magic if present
      letters.forEach((letter) => {
        letter.classList.remove("initial-magic");
      });

      // Animate out
      letters.forEach((letter, index) => {
        setTimeout(() => {
          letter.classList.add("morphing");
          letter.style.transform = `translate(${Math.random() * 100 - 50}px, ${
            Math.random() * 100 - 50
          }px) rotate(${Math.random() * 360 - 180}deg)`;
          letter.style.opacity = "0";
        }, index * 50);
      });

      // Create particles
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement("div");
        particle.classList.add("particle");
        document.body.appendChild(particle);
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.opacity = "0";

        setTimeout(() => {
          particle.style.opacity = "1";
          particle.style.transform = `translate(${
            Math.random() * 200 - 100
          }px, ${Math.random() * 200 - 100}px) scale(${
            Math.random() * 0.5 + 0.5
          })`;
          setTimeout(() => {
            particle.style.opacity = "0";
            setTimeout(() => particle.remove(), 500);
          }, 500);
        }, Math.random() * 500);
      }

      // After out animation, animate in new text
      setTimeout(() => {
        splitText(targetText);
        const newLetters = containerRef.current!.querySelectorAll(
          ".letter"
        ) as NodeListOf<HTMLSpanElement>;
        newLetters.forEach((letter, index) => {
          letter.classList.add("morphing");
          letter.style.transform = `translate(${Math.random() * 100 - 50}px, ${
            Math.random() * 100 - 50
          }px) rotate(${Math.random() * 360 - 180}deg)`;
          letter.style.opacity = "0";
          setTimeout(() => {
            letter.style.transform = "translate(0, 0) rotate(0deg)";
            letter.style.opacity = "1";
            setTimeout(() => letter.classList.remove("morphing"), 500);
          }, index * 50);
        });
      }, letters.length * 50 + 500);
    };

    useEffect(() => {
      splitText(originalText);
    }, [originalText, splitText]);

    useImperativeHandle(ref, () => ({
      castSpell,
      reset,
    }));

    const css = `
      .magic-text-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background-color: #111;
        color: #fff;
        font-family: 'Times New Roman', serif;
      }
      .inner-container {
        text-align: center;
      }
      .text-container {
        font-size: 48px;
        letter-spacing: 2px;
        margin-bottom: 20px;
      }
      .letter {
        display: inline-block;
        transition: transform 0.5s ease, opacity 0.5s ease, text-shadow 0.3s ease;
      }
      .letter.morphing {
        text-shadow: 0 0 10px gold;
      }
      .letter.initial-magic {
        animation: magicalFloat 3s infinite ease-in-out;
      }
      @keyframes magicalFloat {
        0%, 100% {
          transform: translateY(0px);
          text-shadow: 0 0 5px gold;
        }
        50% {
          transform: translateY(-5px);
          text-shadow: 0 0 15px gold;
        }
      }
      .particle {
        position: absolute;
        width: 5px;
        height: 5px;
        background: gold;
        border-radius: 50%;
        pointer-events: none;
        transition: transform 0.5s ease-out, opacity 0.5s ease;
      }
    `;

    return (
      <div className="magic-text-container">
        <style>{css}</style>
        <div className="inner-container">
          <div ref={containerRef} className="text-container"></div>
        </div>
      </div>
    );
  }
);

MagicText.displayName = "MagicText";
