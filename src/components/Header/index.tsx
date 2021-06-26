import Link from "next/link";

import styles from "./header.module.scss";

export default function Header() {
  return (
    <div className={styles.headerContainer}>
      <Link href="/">
        <img src="./logo.svg" alt="logo" style={{ cursor: "pointer" }} />
      </Link>
    </div>
  );
}
