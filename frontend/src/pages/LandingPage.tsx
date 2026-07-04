import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { FiArrowRight, FiActivity, FiLayers, FiEye, FiDownload, FiCpu, FiDatabase, FiLock, FiGlobe } from 'react-icons/fi';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const faqData = [
    {
      q: "How does the AI colorization model work on grayscale IR images?",
      a: "The platform uses a PyTorch U-Net neural network that processes the Lightness (L) channel of the LAB color space. The model predicts the 'ab' chrominance values. This neural mapping is combined with multi-spectral color palettes to output natural color distributions, revealing structural details of target objects."
    },
    {
      q: "What types of infrared imagery can I upload?",
      a: "We support standard satellite formats including PNG, JPEG, JPG, and TIFF. TIFF images are particularly valuable for remote sensing, as they contain high-precision radiometric data which our pipeline preserves during normalization."
    },
    {
      q: "Can I use this platform offline?",
      a: "Yes. The backend architecture includes an automatic MongoDB fallback to a local JSON database and runs neural inferences on CPU/GPU locally without relying on external cloud APIs, making it fully deployable on standalone local systems."
    },
    {
      q: "How does Super Resolution improve object interpretation?",
      a: "By feeding the contrast-enhanced infrared images through a PyTorch Super-Resolution Convolutional Neural Network (SRCNN), we perform sub-pixel interpolation. This reconstructs high-frequency details, improving edge sharpness and making object outlines (such as vehicles, structures, or waterways) far easier to classify."
    }
  ];

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background Animated Blobs */}
      <div className="bg-mesh mesh-1" />
      <div className="bg-mesh mesh-2" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">ISRO Hackathon 2026</span>
          </div>

          {/* Heading */}
          <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight text-white mb-6 leading-tight max-w-4xl">
            AI-Powered <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent text-glow">Infrared Image</span> Colorization & Enhancement
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl mb-10 leading-relaxed">
            Enhance object interpretation and reveal hidden features in remote sensing satellite infrared imagery. Powered by PyTorch deep learning and OpenCV pipelines.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isAuthenticated ? "/upload" : "/register"} className="btn-primary py-4 px-8 text-base">
              Get Started Free <FiArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="btn-secondary py-4 px-8 text-base">
              Explore Features
            </a>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 glass-card">
          <div className="text-center p-4">
            <div className="text-3xl md:text-4xl font-extrabold text-white font-display mb-1">99.8%</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Uptime Reliability</div>
          </div>
          <div className="text-center p-4 border-l border-white/5">
            <div className="text-3xl md:text-4xl font-extrabold text-white font-display mb-1">&lt;1.2s</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Processing Latency</div>
          </div>
          <div className="text-center p-4 border-l border-white/5">
            <div className="text-3xl md:text-4xl font-extrabold text-white font-display mb-1">100%</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Local Processing</div>
          </div>
          <div className="text-center p-4 border-l border-white/5">
            <div className="text-3xl md:text-4xl font-extrabold text-white font-display mb-1">TIFF / JPG</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Format Support</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl md:text-5xl text-white mb-4">Core Image Processing Pipeline</h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            From raw satellite transmission to high-contrast interpretable colors, our automated AI pipeline processes images in real time.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Card 1 */}
          <motion.div variants={itemVariants} className="glass-card glass-card-hover p-6">
            <div className="w-12 h-12 rounded-xl bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center text-accent-purple mb-5">
              <FiLayers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">CLAHE Normalization</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Adaptive histogram equalization adjusts local contrast blocks, revealing terrain profiles hidden in flat brightness layers.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={itemVariants} className="glass-card glass-card-hover p-6">
            <div className="w-12 h-12 rounded-xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue mb-5">
              <FiActivity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Super Resolution</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              A deep convolutional autoencoder reconstructs missing pixels, upscaling satellite image definitions up to 1.5x with sharpness.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={itemVariants} className="glass-card glass-card-hover p-6">
            <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan mb-5">
              <FiEye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Neural Colorization</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Predicts chromatic spectra on LAB maps using deep U-Net architectures, colorizing cold/warm signatures of targets.
            </p>
          </motion.div>

          {/* Card 4 */}
          <motion.div variants={itemVariants} className="glass-card glass-card-hover p-6">
            <div className="w-12 h-12 rounded-xl bg-accent-indigo/10 border border-accent-indigo/30 flex items-center justify-center text-accent-indigo mb-5">
              <FiDownload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Bilateral Edge Filter</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Bilateral smoothers lock down structural outlines, preventing noise bleeds while preserving building/vehicle contours.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">Enterprise Grade Tech Stack</h2>
            <p className="text-slate-400 leading-relaxed">
              Built with industry-standard, performant frameworks to guarantee fast model execution, secure user tokens, and smooth user interactions.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 glass-card flex items-center gap-3">
              <FiCpu className="text-accent-purple w-5 h-5" />
              <div>
                <div className="text-sm font-bold text-white">PyTorch</div>
                <div className="text-xs text-slate-400">Deep Learning</div>
              </div>
            </div>
            <div className="p-4 glass-card flex items-center gap-3">
              <FiLayers className="text-accent-blue w-5 h-5" />
              <div>
                <div className="text-sm font-bold text-white">OpenCV</div>
                <div className="text-xs text-slate-400">Image Filtering</div>
              </div>
            </div>
            <div className="p-4 glass-card flex items-center gap-3">
              <FiGlobe className="text-accent-cyan w-5 h-5" />
              <div>
                <div className="text-sm font-bold text-white">FastAPI</div>
                <div className="text-xs text-slate-400">REST APIs</div>
              </div>
            </div>
            <div className="p-4 glass-card flex items-center gap-3">
              <FiDatabase className="text-accent-purple w-5 h-5" />
              <div>
                <div className="text-sm font-bold text-white">MongoDB</div>
                <div className="text-xs text-slate-400">Data Storage</div>
              </div>
            </div>
            <div className="p-4 glass-card flex items-center gap-3">
              <FiLock className="text-accent-blue w-5 h-5" />
              <div>
                <div className="text-sm font-bold text-white">JWT / OAuth2</div>
                <div className="text-xs text-slate-400">Secure Access</div>
              </div>
            </div>
            <div className="p-4 glass-card flex items-center gap-3">
              <FiActivity className="text-accent-cyan w-5 h-5" />
              <div>
                <div className="text-sm font-bold text-white">React 19</div>
                <div className="text-xs text-slate-400">Vite & Tailwind</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 border-t border-white/5">
        <h2 className="font-display font-bold text-3xl text-center text-white mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqData.map((faq, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                onClick={() => toggleFaq(i)}
                className="w-full text-left p-6 font-semibold text-slate-200 hover:text-white flex justify-between items-center transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-accent-purple font-bold text-lg">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
export default LandingPage;
