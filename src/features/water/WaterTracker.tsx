import React, { useState } from 'react';
import './WaterTracker.css'; // Import CSS for styling

const WaterTracker = () => {
    const [glasses, setGlasses] = useState(0);
    const [target, setTarget] = useState(8); // Default target to 8 glasses

    const handleAddGlass = () => {
        setGlasses(glasses + 1);
    };

    const handleRemoveGlass = () => {
        if (glasses > 0) {
            setGlasses(glasses - 1);
        }
    };

    const progressPercentage = (glasses / target) * 100;

    return (
        <div className="water-tracker">
            <h2>Water Intake Tracker</h2>
            <div className="counter">
                <button onClick={handleRemoveGlass}>-</button>
                <span>{glasses} glasses</span>
                <button onClick={handleAddGlass}>+</button>
            </div>
            <div className="progress-bar">
                <div 
                    className="progress" 
                    style={{ width: `${progressPercentage}%` }}>
                </div>
            </div>
            <div className="target-input">
                <label htmlFor="target">Target Glasses: </label>
                <input 
                    type="number" 
                    id="target" 
                    value={target} 
                    onChange={(e) => setTarget(Number(e.target.value))}
                />
            </div>
        </div>
    );
};

export default WaterTracker;