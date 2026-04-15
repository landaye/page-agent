import React from 'react';
import Header from './components/Header';
import Home from './home/index';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="w-[320px] h-[580px] flex flex-col justify-between bg-white overflow-hidden shadow-md">
      <Header />
      <Home />
      <Footer />
    </div>
  );
};

export default App;