import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // Import carousel styles
import styles from "./c.module.css"; // Import CSS Module styles

const ImageCarousel = ({ images }) => {
  return (
    <Carousel
      showArrows={true}
      showStatus={false}
      showIndicators={true}
      infiniteLoop={true}
      showThumbs={false}
      autoPlay={true}
      stopOnHover={true}
      swipeable={true}
      dynamicHeight={true}
      className={styles.customCarousel}
    >
      {images.map((image, index) => (
        <div key={index}>
          <img src={image.src} alt={image.alt} />
        </div>
      ))}
    </Carousel>
  );
};

export default ImageCarousel;
