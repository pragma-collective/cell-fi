import Image from "next/image";
import Sidebar from './sidebar';
import Summary from './summary';
import Transactions from './transactions';

export default function Dashboard() {
  return (
    <div className="h-full p-5">
      <div className="grid grid-cols-12 mb-5">
        <div className="col-span-3 xl:col-span-2 flex items-center">
          <Image src="/logo.svg" width={250} height={55} className="max-w-[120px] h-auto" alt="logo" />
        </div>
        <div className="col-span-9 xl:col-span-10">
          <div className="flex items-center justify-between">
            <h3>Dashboard</h3>
            <div className="flex items-center gap-[10px]">
              <img src="https://randomuser.me/api/portraits/men/93.jpg" width={128} height={128} className="w-[32px] h-[32px] object-cover rounded-full" alt="" />
              <div>
                <h6 className="!text-[14px] !font-bold text-[var(--color-gray)]">Jhuds Bayutot</h6>
                <p className="!text-[12px] text-right text-[var(--color-gray-dark)]">********7634</p>
                </div>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="grid grid-cols-12 mb-5 hidden">
        <div className="col-span-3 flex items-center">
          <Image src="/logo.svg" width={250} height={55} className="max-w-[120px] h-auto" alt="logo" />
        </div>
        <div className="col-span-9">
          <div className="flex items-center justify-between">
            <h3>Dashboard</h3>
            <div className="flex items-center gap-[30px]">
              <div className="flex flex-col gap-[5px] leading-none">
                <div className="h2 font-bold text-[var(--color-primary)]">$309.14</div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[var(--color-primary)] font-bold">Current</span>
                    <span className="text-[12px]">$314,150.00</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-[5px] leading-none">
                <div className="h2 font-bold text-[var(--color-tertiary)]">$309.14</div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[var(--color-gray-dark)] font-bold">Savings</span>
                    <span className="text-[12px]">$314,150.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}
      <div className="grid grid-cols-12">
        <Sidebar />
        <div className="col-span-9 xl:col-span-10">
          <div className="w-full bg-white text-[var(--color-dark-purple)] rounded-[8px] p-10">
            <Summary />
            <hr className="border-[var(--color-gray)] my-10 -mx-10" />
            <Transactions />
          </div>
        </div>
      </div>
    </div>
  );
}