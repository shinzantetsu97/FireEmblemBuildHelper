export default function GrowthBar({ value }: { value: number }) {
  return (
    <div className="growth-cell">
      <span>{value}%</span>
      <span className="growth-track" aria-hidden="true"><span style={{ width: `${value}%` }} /></span>
    </div>
  );
}
