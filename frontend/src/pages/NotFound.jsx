// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Global style overrides & animations – similar to login */}
      <style jsx>{`
        :root {
          /* Reuse similar neural vars if you want – or keep simple */
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .neural-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.25) 0%, transparent 50%);
          animation: neural-pulse 5s ease-in-out infinite alternate;
        }

        @keyframes neural-pulse {
          0%   { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0.75; transform: scale(1.03); }
        }

        .neural-node {
          position: absolute;
          width: 10px;
          height: 10px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
          animation: float 7s ease-in-out infinite;
        }

        .neural-node:nth-child(1) { top: 15%; left: 25%; animation-delay: 0s; }
        .neural-node:nth-child(2) { top: 55%; left: 65%; animation-delay: 2.3s; }
        .neural-node:nth-child(3) { top: 75%; left: 15%; animation-delay: 4.1s; }
        .neural-node:nth-child(4) { top: 35%; left: 85%; animation-delay: 1.4s; }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-14px) scale(1.15); }
        }

        .neural-line {
          position: absolute;
          height: 1.5px;
          background: linear-gradient(to right, transparent, rgba(99, 102, 241, 0.3), transparent);
          animation: line-glow 4.5s ease-in-out infinite;
        }

        .neural-line:nth-child(5)  { top: 25%; left: 15%; width: 70%; animation-delay: 0.8s; }
        .neural-line:nth-child(6)  { top: 65%; left: 30%; width: 40%; transform: rotate(-35deg); animation-delay: 2.8s; }
        .neural-line:nth-child(7)  { top: 45%; left: 55%; width: 35%; transform: rotate(50deg); animation-delay: 3.5s; }

        @keyframes line-glow {
          0%, 100% { opacity: 0.15; }
          50%      { opacity: 0.45; }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.7s ease-out forwards;
        }
      `}</style>

      {/* Neural animated background */}
      <div className="neural-bg">
        <div className="neural-node" />
        <div className="neural-node" />
        <div className="neural-node" />
        <div className="neural-node" />
        <div className="neural-line" />
        <div className="neural-line" />
        <div className="neural-line" />
      </div>

      {/* Main content card – similar shape & shadow to login */}
      <div className="relative max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row z-10">
        {/* Left: Error message & CTA */}
        <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
          <h1 className="text-8xl lg:text-9xl font-black text-indigo-600 mb-4 animate-fade-in-up">404</h1>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 animate-fade-in-up animation-delay-200">
            Page not found
          </h2>
          
          <p className="text-lg text-gray-600 max-w-md mb-10 animate-fade-in-up animation-delay-400">
            The page you are looking for might have been moved, deleted, 
            or perhaps it never existed in this dimension.
          </p>

          <Link
            to="/dashboard"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 rounded-2xl shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 animate-fade-in-up animation-delay-600"
          >
            ← Return to Dashboard
          </Link>
        </div>

        {/* Right: Visual / branding side – similar to login right panel */}
        <div className="flex-1 relative bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 min-h-[400px] lg:min-h-auto flex items-center justify-center">
          {/* Optional: larger logo or fun AI-themed illustration */}
          <div className="text-center">
            <h3 className="text-6xl font-bold text-indigo-700/80 mb-4">AIDEN</h3>
            <p className="text-xl text-gray-700/80 max-w-xs mx-auto">
              Agentic Intelligence Dual-use Evaluation Network
            </p>
          </div>

          {/* You can replace with <img src="/blank_logo.png" ... /> like in login */}
        </div>
      </div>

      {/* Extra global fade animation helper */}
      <style jsx>{`
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
}