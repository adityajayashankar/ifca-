import styles from './theme.module.scss'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const Theme = ({themeImg, isActive}) => {
  return (
    <div className={styles.themeCont}>
        <img src={themeImg} alt="" />
        <span className={styles.themeTitle}>Theme Name</span>
        {isActive && <span className={styles.isActiveMarker}><CheckCircleOutlineIcon fontSize='large' /></span>}
    </div>
  )
}

export default Theme