import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-space-900 border-t border-white/5 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:flex md:justify-between md:items-center">
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} ISRO Hackathon Project. Developed for Satellite IR Image Colorization & Enhancement.
        </p>
        <div className="flex justify-center gap-6 mt-4 md:mt-0 text-sm text-slate-400">
          <a href="#" className="hover:text-accent-purple transition-colors">Documentation</a>
          <a href="#" className="hover:text-accent-purple transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-accent-purple transition-colors">ISRO Guidelines</a>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
