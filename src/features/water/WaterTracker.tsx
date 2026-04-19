import { useState } from "react";
import "./WaterTracker.css";

const WaterTracker = () => {
  const [glasses, setGlasses] = useState(0);
  const [target, setTarget] = useState(8);

  const handleAddGlass = () => {
    setGlasses((currentGlasses) => currentGlasses + 1);
  };

  const handleRemoveGlass = () => {
    setGlasses((currentGlasses) => Math.max(currentGlasses - 1, 0));
  };

  const progressPercentage = target > 0 ? Math.min((glasses / target) * 100, 100) : 0;

  return (
    <div className="water-tracker">
      <h2>Water Intake Tracker</h2>
      <div className="counter">
        <button type="button" onClick={handleRemoveGlass}>
          -
        </button>
        <span>{glasses} glasses</span>
        <button type="button" onClick={handleAddGlass}>
          +
        </button>
      </div>
      <div className="progress-bar">
        <div
          className="progress"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="target-input">
        <label htmlFor="target">Target Glasses: </label>
        <input
          type="number"
          id="target"
          min="1"
          value={target}
          onChange={(event) => setTarget(Math.max(Number(event.target.value) || 0, 1))}
        />
      </div>
    </div>
  );
};

export default WaterTracker;
