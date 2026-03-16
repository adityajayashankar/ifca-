import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { MdCancel, MdSegment } from 'react-icons/md';
import { useSelector } from 'react-redux';
import { selectUser } from 'store/features/userSlice';
const NavLink = ({ navlink }) => {
    const router = useRouter();
    return (
        <Link href={navlink.path}>
            <a
                className={
                    router.pathname === navlink.path
                        ? 'navbar__item__active'
                        : 'navbar__item'
                }>
                {navlink.name}
            </a>
        </Link>
    );
};

const NavbarSignedIn = () => {
    const [open, setOpen] = useState(true);
    const paths = [
        { path: '/', name: 'Home' },
        { path: '/session', name: 'Sessions' },
        { path: '/pricing', name: 'Pricing' },
        { path: '/blog', name: 'Blog' },
        { path: '/shop', name: 'Shop' },
    ];

    const user = useSelector(selectUser);

    useEffect(() => {
        const handleResize = (e) => {
            if (window.innerWidth > 768 && !open) {
                setOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [open]);

    return (
        <nav className='navbar'>
            <div className='navbar__container'>
                <div className='h-full w-32'>
                    <Image
                        src='/assets/images/logo_name.svg'
                        alt='logo'
                        width={454}
                        height={139}
                        layout='responsive'
                    />
                </div>

                <div
                    className={`navbar__items ${
                        open
                            ? 'navbar__items__visible'
                            : 'navbar__items__hidden'
                    }`}>
                    {paths.map((navlink, index) => (
                        <NavLink navlink={navlink} key={'navlink' + index} />
                    ))}
                    {user ? (
                        <div>{user.name}</div>
                    ) : (
                        <Link href='/auth' passHref>
                            <button className='btn btn-pink'>Login</button>
                        </Link>
                    )}
                </div>
                <button
                    className='absolute visible md:hidden top-0 right-0 text-2xl p-2 rounded-full'
                    onClick={() => {
                        setOpen((prev) => !prev);
                    }}>
                    {open ? <MdCancel /> : <MdSegment />}
                </button>
            </div>
        </nav>
    );
};

export default NavbarSignedIn;
