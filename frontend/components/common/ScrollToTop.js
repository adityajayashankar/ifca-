import React, { useEffect, useState } from 'react';
import { MdArrowUpward } from 'react-icons/md';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    const handleScrollToTop = () => {
        window.scroll({
            top: 0,
            left: 0,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        const handleScroll = (e) => {
            if (window.scrollY && window.scrollY > 750) {
                setIsVisible(true);
            } else if (isVisible) {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isVisible]);

    return (
        <button
            className={`scrolltotop__btn ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            disabled={isVisible !== null ? !isVisible : false}
            onClick={handleScrollToTop}>
            <MdArrowUpward />
        </button>
    );
};

export default ScrollToTop;
