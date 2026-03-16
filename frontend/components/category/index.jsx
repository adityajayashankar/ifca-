const Category = ({ cat, active, setActive, setSelectedCat, index }) => {
  return (
    <div
      onClick={() => {
        setActive(cat.id), setSelectedCat(index);
      }}
      className={
        active === cat?.id
          ? "pill-button pill-button-active whitespace-nowrap"
          : "pill-button whitespace-nowrap"
      }
    >
      {cat?.name}
    </div>
  );
};

export default Category;
