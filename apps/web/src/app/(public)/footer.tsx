import { PropsWithChildren } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DiscordLogoIcon,
  GitHubLogoIcon,
  InstagramLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";

import { Icons } from "@craftgen/ui/components/icons";

// import { getLatestRelease } from './docs/changelog/data';
// import Logo from './logo.png';

export async function Footer() {
  // const latestRelease = await getLatestRelease();

  return (
    <footer
      id="footer"
      className="relative z-50 w-screen overflow-hidden backdrop-blur"
    >
      <div className="min-h-64 m-auto  grid max-w-[100rem] grid-cols-2 gap-6 p-8 pb-20 pt-10  sm:grid-cols-2 lg:grid-cols-6">
        <div className="col-span-2">
          <h1 className="font-sans text-2xl  font-black tracking-tighter  md:text-5xl">
            CraftGen
          </h1>
          <p className="text-gray-350 text-sm opacity-50">
            &copy; Copyright {new Date().getFullYear()} Nokta PTE LTD.
          </p>
          <div className="mb-10 mt-12 flex flex-row space-x-3">
            <FooterLink link="https://x.com/craftgenai">
              <TwitterLogoIcon className="size-6" />
            </FooterLink>
            <FooterLink aria-label="discord" link="/discord">
              <DiscordLogoIcon className="size-6" />
            </FooterLink>
            <FooterLink
              aria-label="instagram"
              link="https://instagram.com/craftgenai"
            >
              <InstagramLogoIcon className="size-6" />
            </FooterLink>
            <FooterLink aria-label="github" link="https://github.com/craftgen">
              <GitHubLogoIcon className="size-6" />
            </FooterLink>
            <FooterLink
              aria-label="open collective"
              link="https://opencollective.com/craftgen"
            >
              <Icons.openCollective className="size-6" />
            </FooterLink>
          </div>
        </div>

        <div className="col-span-1 flex flex-col space-y-2">
          <h1 className="mb-1 text-xs font-bold uppercase ">About</h1>

          {/* <FooterLink link="/team">Team</FooterLink> */}
          {/* <FooterLink link="/docs/product/resources/faq">FAQ</FooterLink> */}
          <FooterLink link="/careers">Careers</FooterLink>
          {/* {latestRelease && (
						<FooterLink
							link={`/docs/changelog/${latestRelease.category}/${latestRelease.tag}`}
						>
							Changelog
						</FooterLink>
					)} */}
          <FooterLink link="/blog">Blog</FooterLink>
        </div>
        <div className="col-span-1 flex flex-col space-y-2">
          <h1 className="mb-1 text-xs font-bold uppercase">Downloads</h1>
          <div className="col-span-1 flex flex-col space-y-2">
            <FooterLink link="/api/releases/desktop/stable/darwin/aarch64">
              macOS
            </FooterLink>
            <FooterLink link="/api/releases/desktop/stable/darwin/x86_64">
              macOS Intel
            </FooterLink>
            <FooterLink link="/api/releases/desktop/stable/windows/x86_64">
              Windows
            </FooterLink>
            <FooterLink link="/api/releases/desktop/stable/linux/x86_64">
              Linux
            </FooterLink>
          </div>
          <div className="pointer-events-none col-span-1 flex flex-col space-y-2 opacity-50">
            <FooterLink link="#">Android</FooterLink>
            <FooterLink link="#">iOS</FooterLink>
          </div>
        </div>
        <div className="col-span-1 flex flex-col space-y-2">
          <h1 className="mb-1 text-xs font-bold uppercase ">Developers</h1>
          <FooterLink link="/docs">Documentation</FooterLink>
          <FooterLink
            blank
            link="https://github.com/craftgen/craftgen/blob/main/CONTRIBUTING.md"
          >
            Contribute
          </FooterLink>
          <div className="pointer-events-none opacity-50">
            <FooterLink link="#">Extensions</FooterLink>
          </div>
          <div className="pointer-events-none opacity-50">
            <FooterLink link="#">Self Host</FooterLink>
          </div>
        </div>
        <div className="col-span-1 flex flex-col space-y-2">
          <h1 className="mb-1 text-xs font-bold uppercase ">Org</h1>
          <FooterLink blank link="https://opencollective.com/craftgen">
            Open Collective
          </FooterLink>
          <FooterLink
            blank
            link="https://github.com/craftgen/craftgen/blob/main/LICENSE"
          >
            License
          </FooterLink>
          <div>
            <FooterLink link="/legal/privacy-policy">Privacy</FooterLink>
          </div>
          <div>
            <FooterLink link="/legal/terms-and-conditions">Terms</FooterLink>
          </div>
        </div>
      </div>
      <div className="absolute top-0 flex h-1 w-full flex-row items-center justify-center opacity-100">
        <div className="h-px w-1/2 bg-gradient-to-r from-transparent to-white/10"></div>
        <div className="h-px w-1/2 bg-gradient-to-l from-transparent to-white/10"></div>
      </div>
      <div className="absolute h-full w-full bg-gradient-to-tr from-transparent  to-white/10 " />
    </footer>
  );
}

function FooterLink({
  blank,
  link,
  ...props
}: PropsWithChildren<{ link: string; blank?: boolean }>) {
  return (
    <Link
      href={link}
      target={blank ? "_blank" : ""}
      className="text-muted-foreground duration-300 hover:text-primary hover:opacity-50"
      rel="noreferrer"
      {...props}
    >
      {props.children}
    </Link>
  );
}
