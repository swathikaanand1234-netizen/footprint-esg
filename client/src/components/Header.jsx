import React from 'react';
import { PlusCircle, Factory, Building2 } from 'lucide-react';

export const Header = ({ 
  title, 
  onOpenDataEntry 
}) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <h1 className="page-heading">{title}</h1>
          <div className="topbar-subtitle-row">
            <span className="plant-scope-tag">
              <Building2 size={12} />
              <span>4 Global Plants • Austin, Stuttgart, Yokohama, Monterrey</span>
            </span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <button 
          className="btn btn-primary btn-sm btn-enter-data"
          onClick={onOpenDataEntry}
          aria-label="Enter monthly utility and plant data"
        >
          <PlusCircle size={15} />
          <span>Enter Monthly Data</span>
        </button>
      </div>
    </header>
  );
};
