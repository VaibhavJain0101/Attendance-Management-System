const StatCard = ({ title, value, subtitle }) => (
  <section className="stat-card">
    <p className="stat-card__title">{title}</p>
    <h3>{value}</h3>
    {subtitle ? <p className="stat-card__subtitle">{subtitle}</p> : null}
  </section>
);

export default StatCard;
