// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Account from "./login/Account";
// import secureLocalStorage from "react-secure-storage";

// export default function HomePage() {
//   const [walletExists, setWalletExists] = useState<boolean | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//     const hasWallet = secureLocalStorage.getItem("account") !== null;
//     console.log("hasWallet:", hasWallet);

//     if (!hasWallet) {
//       router.push("/login");
//     } else {
//       setWalletExists(true);
//     }
//   }, []);

//   if (walletExists === null) return null;

//   return <Account />;
// }
