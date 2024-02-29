import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

const steps = [
  {
    id: 1,
    name: "Actor Model",
    href: "#",
    status: "complete",
    description:
      "Setup the actor model for the modular AI allowing for easy integration of new models.",
    section: "bigbang",
  },
  {
    id: 2,
    name: "Graph Architecture",
    href: "#",
    status: "complete",
    description:
      "Utilize the graph architecture to create cyclic AI agent workflows.",
    section: "bigbang",
  },
  {
    id: 3,
    name: "Multi-Modal ",
    href: "#",
    status: "current",
    description:
      "Wide range of models including text generation, image generation, vision, text-to-speech, speech-to-text, and embedding models.",
    section: "bigbang",
  },
  {
    id: 4,
    name: "Observability and logging",
    href: "#",
    status: "upcoming",
    description: "Have a clear view of the AI agent's workflow and logs.",
    section: "v0.1",
  },
  {
    id: 5,
    name: "Marketplace",
    href: "#",
    status: "upcoming",
    description: "Share your workflows with the community. ",
    section: "v0.1",
  },
  {
    id: 6,
    name: "Get paid for your workflows",
    href: "#",
    status: "upcoming",
    description: "Monetize your workflows. Integration with Stripe connect.",
    section: "v0.1",
  },
  {
    id: 7,
    name: "API",
    href: "#",
    status: "upcoming",
    description: "Create an API for easy integration.",
    section: "v0.1",
  },
  {
    id: 8,
    name: "Desktop App",
    href: "#",
    status: "upcoming",
    description: "Craftgen desktop app to run workflows locally.",
    section: "v0.2",
  },
];

const changelog = `
<div class="relative max-w-5xl lg:pl-8 lg:pr-8 sm:pl-6 sm:pr-6 pl-4 pr-4 ml-auto mr-auto" style="background-color: rgb(255, 255, 255);">
	<section id="2023-12-20" aria-labelledby="2023-12-20-heading" class="md:flex">
		<h2 id="2023-12-20-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
			<a href="#2023-12-20" class="">December 20, 2023</a>
		</h2>
		<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
			<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-3 md:top-2.5">
			</div>
			<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
			</div>
			<div class="max-w-none text-sm leading-[1.71429]">
				<h3 class="text-base text-slate-900 font-semibold m-0">Introducing Catalyst: A modern application UI kit for React</h3>
				<p class="m-0">We just released the first development preview of <a href="https://tailwindui.com/templates/catalyst" inertia="" class="text-sky-500 font-semibold no-underline">Catalyst</a>, our first fully-componentized, batteries-included application UI kit for React — real components with thoughtfully designed APIs that build on each other to create a real component architecture, the same way we’d do it in a real application.</p>
				<p class="m-0">There’s a lot more to come, but we’re releasing it today so you can play with it right away as we continue to build new components and find ways to make it an even better experience.</p>
				<a href="https://tailwindui.com/templates/catalyst" inertia="" class="mb-0 text-sky-500 font-semibold no-underline">
					<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/templates/catalyst/preview.png" alt="The new Catalyst UI kit">
				</a>
			</div>
		</div>
	</section>
	<section id="2023-09-07" aria-labelledby="2023-09-07-heading" class="md:flex">
		<h2 id="2023-09-07-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
			<a href="#2023-09-07">September 7, 2023</a>
		</h2>
		<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
			<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
			</div>
			<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
			</div>
			<div class="max-w-none text-sm leading-[1.71429]">
				<h3 class="text-base text-slate-900 font-semibold m-0">Next.js site templates now available in TypeScript</h3>
				<p class="m-0">All of our Next.js site <a href="https://tailwindui.com/templates" inertia="" class="text-sky-500 font-semibold no-underline">templates</a> are now available in both JavaScript and TypeScript, so you can choose whichever language is the better fit for you and your team.</p>
				<a href="https://tailwindui.com/templates" inertia="" class="text-sky-500 font-semibold no-underline">
					<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/changelog/20230907-typescript-templates.png" alt="Tailwind UI templates now available in TypeScript">
				</a>
				<p class="m-0">When you download a template, you'll find two folders in the zip file — <code class="text-slate-900 font-semibold font-mono [font-variation-settings:normal] text-[1em]">/{template}-js</code> and <code class="text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">/{template}-ts</code>, each containing the source code for the entire template in the corresponding language.</p>
				<p class="m-0">Each template has been authored with the latest version of TypeScript by nerds who get way too much satisfaction out of getting the types just right, so if TypeScript is your thing, you should find the experience very satisfying.</p>
			</div>
		</div>
	</section>
	<section id="2023-07-13" aria-labelledby="2023-07-13-heading" class="md:flex">
		<h2 id="2023-07-13-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
			<a href="#2023-07-13">July 13, 2023</a>
		</h2>
		<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
			<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
			</div>
			<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
			</div>
			<div class="max-w-none text-sm leading-[1.71429]">
				<h3 class="text-base text-slate-900 font-semibold m-0">Meet Studio: A beautiful new multi-page agency template</h3>
				<p class="m-0">We've just released <a href="https://tailwindui.com/templates/studio" inertia="" class="text-sky-500 font-semibold no-underline">Studio</a>, a beautiful new multi-page agency template built with Tailwind CSS and Next.js. This is our largest template to date, and it takes advantage of the new app router in Next.js.</p>
				<p class="m-0">We really sweat the details with this template, like using Framer Motion to tastefully include subtle animations throughout the template, and MDX to make the case study and blog post authoring experience a great one.</p>
				<a href="https://tailwindui.com/templates/studio" inertia="" class="mb-0 text-sky-500 font-semibold no-underline">
					<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/templates/studio/preview.png" alt="The new Studio agency template">
				</a>
			</div>
		</div>
	</section>
	<section id="2023-04-24" aria-labelledby="2023-04-24-heading" class="md:flex">
		<h2 id="2023-04-24-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
			<a href="#2023-04-24">April 24, 2023</a>
		</h2>
		<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
			<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
			</div>
			<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
			</div>
			<div class="max-w-none text-sm leading-[1.71429]">
				<h3 class="text-base text-slate-900 font-semibold m-0">All-new application UI pages + huge component update</h3>
				<p class="m-0">We just shipped a big application UI refresh that includes totally redesigned page examples, and dozens of updated and brand new components.</p>
				<a href="https://tailwindui.com/components/application-ui/page-examples/home-screens" inertia="" class="text-sky-500 font-semibold no-underline">
					<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/changelog/20230424-application-ui-update.png" alt="Collage of new application UI component designs">
				</a>
				<p class="m-0">The new page examples include both light and dark designs, and also include the highly coveted home screen design everyone has been asking us for after seeing it used as screenshots in some of our new marketing components.</p>
				<ul class="list-disc list-image-none m-0 p-0">
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new designs to the <a href="https://tailwindui.com/components/application-ui/page-examples/home-screens" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Home Screens</a> category</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new designs to the <a href="https://tailwindui.com/components/application-ui/page-examples/detail-screens" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Detail Screens</a> category</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new designs to a new <a href="https://tailwindui.com/components/application-ui/page-examples/settings-screens" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Settings Screens</a> category</li>
				</ul>
				<p class="m-0">We also went through all of the existing component categories to find opportunities for improvements, including new badges, stacked lists, tables, form layouts, stats sections, and more.</p>
				<ul class="list-disc list-image-none m-0 p-0">
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/elements/badges" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Badges</a> category with 18 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/elements/buttons" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Buttons</a> category with 3 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/data-display/description-lists" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Description Lists</a> category with 7 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/lists/feeds" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Feeds</a> category with 1 new design</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/forms/form-layouts" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Form Layouts</a> category with 5 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/lists/grid-lists" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Grid Lists</a> category with 1 new design</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/application-shells/multi-column" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Multi-Column Layouts</a> category with 6 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/headings/page-headings" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Page Headings</a> category with 2 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/application-shells/sidebar" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Sidebar Layouts</a> category with 8 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/navigation/sidebar-navigation" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Sidebar Navigation</a> category with 5 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/forms/sign-in-forms" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Sign-in and Registration</a> category with 5 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/lists/stacked-lists" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stacked Lists</a> category with 17 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/data-display/stats" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stats</a> category with 2 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/lists/tables" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Tables</a> category with 3 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/navigation/tabs" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Tabs</a> category with 1 new design</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/application-ui/navigation/vertical-navigation" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Vertical Navigation</a> category with 5 new designs</li>
				</ul>
			</div>
		</div>
	</section>
	<section id="2023-04-12" aria-labelledby="2023-04-12-heading" class="md:flex">
		<h2 id="2023-04-12-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
			<a href="#2023-04-12">April 12, 2023</a>
		</h2>
		<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
			<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
			</div>
			<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
			</div>
			<div class="max-w-none text-sm leading-[1.71429]">
				<h3 class="text-base text-slate-900 font-semibold m-0">Introducing Commit: A beautiful new changelog template</h3>
				<p class="m-0">We've just released <a href="https://tailwindui.com/templates/commit" inertia="" class="text-sky-500 font-semibold no-underline">Commit</a>, a beautiful new changelog template built with Tailwind CSS, Next.js, MDX, and a dash of Motion One.</p>
				<p class="m-0">Inspired by plaintext CHANGELOG files, we've built the whole thing in a way that you manage it all from one glorious markdown file — just slap a horizontal rule above your last post and start typing.</p>
				<a href="https://tailwindui.com/templates/commit" inertia="" class="mb-0 text-sky-500 font-semibold no-underline">
					<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/templates/commit/preview.png" alt="The new Commit changelog template">
				</a>
			</div>
		</div>
	</section>
	<section id="2023-04-04" aria-labelledby="2023-04-04-heading" class="md:flex">
		<h2 id="2023-04-04-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
			<a href="#2023-04-04">April 4, 2023</a>
		</h2>
		<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
			<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
			</div>
			<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
			</div>
			<div class="max-w-none text-sm leading-[1.71429]">
				<h3 class="text-base text-slate-900 font-semibold m-0">All-new marketing page examples + tons of component updates</h3>
				<p class="m-0">If you've been watching closely, you might have noticed a lot of "new" badges all over the marketing category the last few weeks.</p>
				<a href="https://tailwindui.com/components/marketing/sections/pricing" inertia="" class="text-sky-500 font-semibold no-underline">
					<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/changelog/20230304-marketing-update.png" alt="Collage of new marketing component designs">
				</a>
				<p class="m-0">We decided it was time to give all of the marketing components a fresh coat of paint, starting with all-new designs for all of the page examples:</p>
				<ul class="list-disc list-image-none m-0 p-0">
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 4 new designs to the <a href="https://tailwindui.com/components/marketing/page-examples/landing-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Landing Pages</a> category</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 3 new designs to the <a href="https://tailwindui.com/components/marketing/page-examples/pricing-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Pricing Pages</a> category</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 3 new designs to a new <a href="https://tailwindui.com/components/marketing/page-examples/about-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">About Pages</a> category</li>
				</ul>
				<p class="m-0">We've also updated every individual marketing component category with new designs, including beautiful new pricing sections, testimonials, logo clouds, team sections, stats, and tons more.</p>
				<ul class="list-disc list-image-none m-0 p-0">
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/pricing" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Pricing Sections</a> category with 13 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/testimonials" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Testimonials</a> category with 9 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/logo-clouds" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Logo Clouds</a> category with 12 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/content-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Content Sections</a> category with 6 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/elements/banners" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Banners</a> category with 13 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/blog-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Blog Sections</a> category with 7 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/contact-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Contact Sections</a> category with 8 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/elements/flyout-menus" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Flyout Menus</a> category with 7 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/header" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Header Sections</a> category with 10 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/elements/headers" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Headers</a> category with 12 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/newsletter-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Newsletter Sections</a> category with 7 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/stats-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stats</a> category with 10 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/team-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Team Sections</a> category with 9 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/cta-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">CTA Sections</a> category with 2 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/feature-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Feature Sections</a> category with 2 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/footers" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Footers</a> category with 1 new design</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated the <a href="https://tailwindui.com/components/marketing/sections/heroes" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Hero Sections</a> category with 2 new designs</li>
				</ul>
			</div>
		</div>
	</section>
	<section id="2023-01-27" aria-labelledby="2023-01-27-heading" class="md:flex">
		<h2 id="2023-01-27-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
			<a href="#2023-01-27">January 27, 2023</a>
		</h2>
		<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
			<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
			</div>
			<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
			</div>
			<div class="max-w-none text-sm leading-[1.71429]">
				<h3 class="text-base text-slate-900 font-semibold m-0">New heroes, feature sections, CTAs, and more</h3>
				<p class="m-0">We've been busy the last few weeks working on a big batch of fresh marketing components for Tailwind UI, including tons of new hero sections, feature sections, CTAs, and more.</p>
				<a href="https://tailwindui.com/components/marketing/sections/heroes" inertia="" class="text-sky-500 font-semibold no-underline">
					<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/changelog/20230127-marketing-update.png" alt="Collage of new marketing component designs">
				</a>
				<p class="m-0">We also spent a bunch of time going through the examples that were already there and gave them a bit of polish — we were pleasantly surprised to discover that yes, we actually have gotten better at design since we released some of these components almost three years ago.</p>
				<ul class="list-disc list-image-none m-0 p-0">
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated all examples in the <a href="https://tailwindui.com/components/marketing/sections/heroes" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Hero Sections</a> category, including 10 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated all examples in the <a href="https://tailwindui.com/components/marketing/sections/feature-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Feature Sections</a> category, including 10 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated all examples in the <a href="https://tailwindui.com/components/marketing/sections/cta-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">CTA Sections</a> category, including 3 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated all examples in the <a href="https://tailwindui.com/components/marketing/sections/faq-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">FAQ Sections</a> category, including 3 new designs</li>
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Updated all examples in the <a href="https://tailwindui.com/components/marketing/sections/footers" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Footers</a> category</li>
				</ul>
			</div>
		</div>
	</section>
	<section id="2022-12-15" aria-labelledby="2022-12-15-heading" class="md:flex">
		<h2 id="2022-12-15-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
			<a href="#2022-12-15">December 15, 2022</a>
		</h2>
		<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
			<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
			</div>
			<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
			</div>
			<div class="max-w-none text-sm leading-[1.71429]">
				<h3 class="text-base text-slate-900 font-semibold m-0">New Protocol template</h3>
				<p class="m-0">Today we're happy to announce the launch of our new <a href="https://tailwindui.com/templates/protocol" inertia="" class="text-sky-500 font-semibold no-underline">Protocol template</a>, a meticulously crafted documentation template tuned for API references.</p>
				<p class="m-0">Powered by MDX, we've sweat all the nitty-gritty details to make sure the authoring experience is an awesome one, letting you focus on just writing great API docs, not the tooling around it.</p>
				<a href="https://tailwindui.com/templates/protocol" inertia="" class="mb-0 text-sky-500 font-semibold no-underline">
					<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/templates/protocol/preview.png" alt="The new Protocol API reference template">
				</a>
			</div>
		</div>
	</section>
	<section id="2022-09-07" aria-labelledby="2022-09-07-heading" class="md:flex">
		<h2 id="2022-09-07-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
			<a href="#2022-09-07">September 7, 2022</a>
		</h2>
		<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
			<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
			</div>
			<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
			</div>
			<div class="max-w-none text-sm leading-[1.71429]">
				<h3 class="text-base text-slate-900 font-semibold m-0">New Spotlight template</h3>
				<p class="m-0">Today we're pumped to announce the launch of our new <a href="https://tailwindui.com/templates/spotlight" inertia="" class="text-sky-500 font-semibold no-underline">Spotlight template</a>, a personal website so nice you'll actually be inspired to publish on it.</p>
				<p class="m-0">Built with Tailwind CSS and Next.js, it includes everything you need to get a personal website up-and-running, including a blog, projects page, dark mode, and more. And as always, it's been designed and built by the Tailwind CSS team.</p>
				<a href="https://tailwindui.com/templates/spotlight" inertia="" class="mb-0 text-sky-500 font-semibold no-underline">
					<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/templates/spotlight/preview.png" alt="The new Spotlight personal website template">
				</a>
			</div>
		</div>
	</section>
	<section id="2022-08-12" aria-labelledby="2022-08-12-heading" class="md:flex">
		<h2 id="2022-08-12-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
			<a href="#2022-08-12">August 12, 2022</a>
		</h2>
		<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
			<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
			</div>
			<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
			</div>
			<div class="max-w-none text-sm leading-[1.71429]">
				<h3 class="text-base text-slate-900 font-semibold m-0">New Pocket template</h3>
				<p class="m-0">Today we're happy to announce the launch of our new <a href="https://tailwindui.com/templates/pocket" inertia="" class="text-sky-500 font-semibold no-underline">Pocket template</a>, the perfect website template for your exciting new mobile app.</p>
				<p class="m-0">Built with Tailwind CSS and Next.js, Pocket is loaded with tons of fun animations and interactions powered by the Framer Motion library. Be sure to check out the <a href="https://pocket.tailwindui.com" class="text-sky-500 font-semibold no-underline">live preview</a> for the full experience.</p>
				<a href="https://tailwindui.com/templates/spotlight" inertia="" class="mb-0 text-sky-500 font-semibold no-underline">
					<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/templates/pocket/preview.png" alt="The new Pocket app marketing template">
				</a>
			</div>
		</div>
	</section>
	<section id="2022-06-23" aria-labelledby="2022-06-23-heading" class="md:flex">
		<h2 id="2022-06-23-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
			<a href="#2022-06-23">June 23, 2022</a>
		</h2>
		<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
			<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
			</div>
			<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
			</div>
			<div class="max-w-none text-sm leading-[1.71429]">
				<h3 class="text-base text-slate-900 font-semibold m-0">Tailwind UI templates</h3>
				<p class="m-0">Today we’re thrilled to announce the launch of <a href="https://tailwindui.com/templates" inertia="" class="text-sky-500 font-semibold no-underline">Tailwind UI templates</a>!</p>
				<a href="https://tailwindui.com/templates" inertia="" class="text-sky-500 font-semibold no-underline">
					<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/changelog/tailwind-ui-templates-banner.png" alt="Tailwind UI templates available now.">
				</a>
				<p class="m-0">These are visually-stunning, easy to customize site templates built with React and Next.js. The perfect starting point for your next project and the ultimate resource for learning how experts build real websites with Tailwind CSS.</p>
				<ul class="list-disc list-image-none m-0 p-0">
					<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">
						<a href="https://tailwindui.com/templates/salient" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Salient template</a> - A beautiful SaaS landing page to announce your next big idea.</li>
						<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">
							<a href="https://tailwindui.com/templates/transmit" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Transmit template</a> - A clean and professional podcast template fit for any show.</li>
							<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">
								<a href="https://tailwindui.com/templates/syntax" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Syntax template</a> - Educate your users in style with this documentation template.</li>
								<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">
									<a href="https://tailwindui.com/templates/keynote" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Keynote template</a> - Launch your next conference with a splash with this eye-catching template.</li>
									<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">
										<a href="https://tailwindui.com/templates/primer" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Primer template</a> - A stunning landing page for your first course or ebook.</li>
									</ul>
								</div>
							</div>
						</section>
						<section id="2022-03-08" aria-labelledby="2022-03-08-heading" class="md:flex">
							<h2 id="2022-03-08-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
								<a href="#2022-03-08">March 8, 2022</a>
							</h2>
							<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
								<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
								</div>
								<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
								</div>
								<div class="max-w-none text-sm leading-[1.71429]">
									<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
									<ul class="list-disc list-image-none m-0 p-0">
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 16 new <a href="https://tailwindui.com/components/application-ui/lists/tables" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Table</a> examples to the Application UI package</li>
									</ul>
								</div>
							</div>
						</section>
						<section id="2022-02-18" aria-labelledby="2022-02-18-heading" class="md:flex">
							<h2 id="2022-02-18-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
								<a href="#2022-02-18">February 18, 2022</a>
							</h2>
							<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
								<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
								</div>
								<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
								</div>
								<div class="max-w-none text-sm leading-[1.71429]">
									<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
									<ul class="list-disc list-image-none m-0 p-0">
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/forms/comboboxes" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Comboboxes</a> category to the Application UI package with 5 examples</li>
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/navigation/command-palettes" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Command Palettes</a> category to the Application UI package with 9 examples</li>
									</ul>
								</div>
							</div>
						</section>
						<section id="2022-02-04" aria-labelledby="2022-02-04-heading" class="md:flex">
							<h2 id="2022-02-04-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
								<a href="#2022-02-04">February 4, 2022</a>
							</h2>
							<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
								<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
								</div>
								<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
								</div>
								<div class="max-w-none text-sm leading-[1.71429]">
									<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
									<ul class="list-disc list-image-none m-0 p-0">
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/data-display/calendars" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Calendars</a> category to the Application UI package with 8 examples</li>
									</ul>
								</div>
							</div>
						</section>
						<section id="2021-11-08" aria-labelledby="2021-11-08-heading" class="md:flex">
							<h2 id="2021-11-08-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
								<a href="#2021-11-08">November 8, 2021</a>
							</h2>
							<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
								<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
								</div>
								<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
								</div>
								<div class="max-w-none text-sm leading-[1.71429]">
									<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
									<ul class="list-disc list-image-none m-0 p-0">
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/forms/textareas" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Textareas</a> category to the Application UI package with 5 examples</li>
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 9 new <a href="https://tailwindui.com/components/application-ui/forms/radio-groups" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Radio Group</a> examples to the Application UI package</li>
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/navigation/steps" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Step</a> example to the Application UI package</li>
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/marketing/sections/faq-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">FAQ</a> example to the Marketing package</li>
									</ul>
								</div>
							</div>
						</section>
						<section id="2021-08-11" aria-labelledby="2021-08-11-heading" class="md:flex">
							<h2 id="2021-08-11-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
								<a href="#2021-08-11">August 11, 2021</a>
							</h2>
							<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
								<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
								</div>
								<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
								</div>
								<div class="max-w-none text-sm leading-[1.71429]">
									<h3 class="text-base text-slate-900 font-semibold m-0">Tailwind UI Ecommerce</h3>
									<p class="m-0">Today we’re excited to announce the launch of <a href="https://tailwindui.com/components#product-ecommerce" inertia="" class="text-sky-500 font-semibold no-underline">Tailwind UI Ecommerce</a>!</p>
									<p class="m-0">
										<a href="https://blog.tailwindcss.com/designing-tailwind-ui-ecommerce" class="text-sky-500 font-semibold no-underline">Almost 6 months in the making</a>, we finally released the first all-new component kit for Tailwind UI since the initial launch back in February 2020.</p>
										<a href="https://tailwindui.com/components#product-ecommerce" inertia="" class="text-sky-500 font-semibold no-underline">
											<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/changelog/tailwind-ui-ecommerce-banner.jpg" alt="Tailwind UI Ecommerce available now.">
										</a>
										<p class="m-0">Tailwind UI Ecommerce adds over 100 new components across 14 new component categories and 7 new page example categories:</p>
										<ul class="list-disc list-image-none m-0 p-0">
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/product-overviews" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Product Overviews</a> category to the Ecommerce package with 5 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/product-lists" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Product Lists</a> category to the Ecommerce package with 11 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/category-previews" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Category Previews</a> category to the Ecommerce package with 6 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/shopping-carts" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Shopping Carts</a> category to the Ecommerce package with 6 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/category-filters" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Category Filters</a> category to the Ecommerce package with 5 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/product-quickviews" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Product Quickviews</a> category to the Ecommerce package with 4 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/product-features" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Product Features</a> category to the Ecommerce package with 9 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/store-navigation" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Store Navigation</a> category to the Ecommerce package with 5 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/promo-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Promo Sections</a> category to the Ecommerce package with 8 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/checkout-forms" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Checkout Forms</a> category to the Ecommerce package with 5 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/reviews" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Reviews</a> category to the Ecommerce package with 4 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/order-summaries" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Order Summaries</a> category to the Ecommerce package with 4 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/order-history" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Order History</a> category to the Ecommerce package with 4 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/components/incentives" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Incentives</a> category to the Ecommerce package with 8 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/page-examples/storefront-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Storefront Pages</a> category to the Ecommerce package with 4 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/page-examples/product-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Product Pages</a> category to the Ecommerce package with 5 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/page-examples/category-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Category Pages</a> category to the Ecommerce package with 5 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/page-examples/shopping-cart-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Shopping Cart Pages</a> category to the Ecommerce package with 3 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/page-examples/checkout-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Checkout Pages</a> category to the Ecommerce package with 5 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/page-examples/order-detail-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Order Detail Pages</a> category to the Ecommerce package with 3 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/ecommerce/page-examples/order-history-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Order History Pages</a> category to the Ecommerce package with 5 examples</li>
										</ul>
									</div>
								</div>
							</section>
							<section id="2021-07-14" aria-labelledby="2021-07-14-heading" class="md:flex">
								<h2 id="2021-07-14-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
									<a href="#2021-07-14">July 14, 2021</a>
								</h2>
								<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
									<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
									</div>
									<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
									</div>
									<div class="max-w-none text-sm leading-[1.71429]">
										<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
										<ul class="list-disc list-image-none m-0 p-0">
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/marketing/feedback/404-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">404 Pages</a> category to the Marketing package with 6 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/feedback/empty-states" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Empty States</a> category to the Application UI package with 6 examples</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 6 new <a href="https://tailwindui.com/components/application-ui/forms/input-groups#component-85e0087460af7ce9f5160485832f72b2" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Input Group</a> examples to the Application UI package</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/forms/checkboxes" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Checkboxes</a> category to the Application UI package with 4 examples</li>
										</ul>
									</div>
								</div>
							</section>
							<section id="2021-05-07" aria-labelledby="2021-05-07-heading" class="md:flex">
								<h2 id="2021-05-07-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
									<a href="#2021-05-07">May 7, 2021</a>
								</h2>
								<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
									<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
									</div>
									<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
									</div>
									<div class="max-w-none text-sm leading-[1.71429]">
										<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
										<ul class="list-disc list-image-none m-0 p-0">
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/marketing/page-examples/pricing-pages#component-e49424af701063c1a85fc20dcfc86c1b" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Pricing Page</a> examples to the Marketing package</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/marketing/sections/pricing#component-f3dd88b8abfd735d38873b8daa09d07d" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Pricing Section</a> examples to the Marketing package</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/marketing/sections/faq-sections#component-cf4a7e94572c67f92ec6601aff223873" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">FAQ</a> examples to the Marketing package</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/marketing/sections/testimonials#component-c0a962fe19bbce39773ad989fe2d672e" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Testimonial</a> example to the Marketing package</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/marketing/elements/headers#component-4aecba5307ec332096ad99f2b688a56d" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Header</a> example to the Marketing package</li>
										</ul>
									</div>
								</div>
							</section>
							<section id="2021-04-14" aria-labelledby="2021-04-14-heading" class="md:flex">
								<h2 id="2021-04-14-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
									<a href="#2021-04-14">April 14, 2021</a>
								</h2>
								<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
									<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
									</div>
									<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
									</div>
									<div class="max-w-none text-sm leading-[1.71429]">
										<h3 class="text-base text-slate-900 font-semibold m-0">React and Vue support</h3>
										<p class="m-0">Today we’re excited to add first class support for React and Vue 3 to all of the examples in Tailwind UI, which makes it even easier to adapt them for your projects.</p>
										<a href="https://tailwindui.com/" inertia="" class="text-sky-500 font-semibold no-underline">
											<img class="rounded-xl mt-[1.71429em] mb-[1.71429em] max-w-full h-auto block align-middle" src="https://tailwindui.com/img/changelog/react-and-vue-support-banner.jpg" alt="Tailwind UI: Now for React and Vue.">
										</a>
										<p class="m-0">It’s been <a href="https://blog.tailwindcss.com/building-react-and-vue-support-for-tailwind-ui" class="text-sky-500 font-semibold no-underline">a long journey</a> but I am super proud of where we ended up on this one, and really think it’s going to make Tailwind UI a useful tool for a whole new group of Tailwind CSS users.</p>
										<ul class="list-disc list-image-none m-0 p-0">
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">
												<strong class="mt-[1.14286em] text-slate-900 font-semibold">Functional and accessible</strong> — all of the React and Vue examples in Tailwind UI are powered <a href="https://headlessui.dev" class="text-sky-500 font-semibold no-underline">Headless UI</a> which handles all of the ARIA attribute management, keyboard interactions, focus handling, and more for you, while keeping all of that gnarly complexity safely tucked away in your <code class="mb-[1.14286em] text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">node_modules</code> folder where we can make improvements and fix bugs on your behalf, without you ever having to change your own code.</li>
												<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">
													<strong class="mb-[1.14286em] mt-[1.14286em] text-slate-900 font-semibold">Fully customizable</strong> — with Headless UI, we’ve managed to abstract away all of the complicated JS functionality without taking away any control over the actual markup. That means that the entire design is still in entirely under your control, and you can fully customize any example by simply adding and removing utility classes like you’re used to.</li>
												</ul>
												<p class="m-0">All of this stuff is available as a totally free update for Tailwind UI customers. Just log in to your account, select between HTML, React, or Vue in the dropdown above any component, and grab the code in the format you want.</p>
											</div>
										</div>
									</section>
									<section id="2021-03-26" aria-labelledby="2021-03-26-heading" class="md:flex">
										<h2 id="2021-03-26-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2021-03-26">March 26, 2021</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/application-ui/page-examples/detail-screens#component-0218c9079330128b7d916325b9ad3f38" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Detail Screen</a> examples to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/page-examples/settings-screens#component-de918ddc41eab4f395f5e48ce2815937" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Settings Screen</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/application-ui/application-shells/multi-column#component-b639fa188098a2dbfd9f419c6ef9c6f3" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Multi-Column Layout</a> examples to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/application-ui/headings/page-headings#component-40a924bca34bb5e303d056decfa530e5" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Page Heading</a> examples to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/lists/grid-lists#component-d6b6c178a9f460d37c542870139e940e" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Grid List</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/forms/select-menus#component-d47b46d3ffea1f6b159f51be4bcae2ff" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Select Menu</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/navigation/tabs#component-70db4dcecc9b8bad86b28ebe23546f27" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Tabs</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/overlays/slide-overs#component-62a04be4dcfb133783a1a2b1774a73fa" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Slide-over</a> example to the Application UI package</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2021-03-10" aria-labelledby="2021-03-10-heading" class="md:flex">
										<h2 id="2021-03-10-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2021-03-10">March 10, 2021</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/marketing/page-examples/about-pages?include=archived" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Contact Pages</a> to the Marketing package with 4 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/marketing/sections/cta-sections#component-8403e31b9d3a3ca6757f0a7bbb926cd0" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">CTA Section</a> example to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/marketing/sections/header#component-17d3a4a8538b7d528d954a5db2874da8" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Header Section</a> examples to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/marketing/sections/newsletter-sections#component-f166d5961b0707369d1dd54aee4b5c87" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Newsletter Section</a> examples to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/marketing/sections/contact-sections#component-1a48413a7b6b49af32a9b2a75de4c0e8" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Contact Section</a> examples to the Marketing package</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2021-02-03" aria-labelledby="2021-02-03-heading" class="md:flex">
										<h2 id="2021-02-03-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2021-02-03">February 3, 2021</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/page-examples/home-screens#component-41dce55c4cd0a0045706dcab2156c2f2" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Home Screen</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/page-examples/detail-screens#component-9a82234fc5cbca3875409b92effa3779" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Detail Screen</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/application-ui/application-shells/multi-column#component-00881f00b48af67e0054c54fd18cad58" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Multi-Column Layout</a> examples to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/headings/section-headings#component-ed0bd6107e9619f08a549f76f5073f20" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Section Heading</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/headings/card-headings#component-566f127b7b70db160352896d06794a7f" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Card Heading</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/lists/stacked-lists#component-873e7c6c9d62158fc888708dc1dcfa03" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stacked List</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/navigation/tabs#component-83b472fc38b57e49a566805a5e5bb2f7" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Tabs</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/navigation/navbars#component-ac4ed72c2e03976dc5415ce711fe2f78" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Navbar</a> example to the Application UI package</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2021-01-21" aria-labelledby="2021-01-21-heading" class="md:flex">
										<h2 id="2021-01-21-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2021-01-21">January 21, 2021</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/marketing/page-examples/landing-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Landing Page</a> examples category to the Marketing package with 3 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 4 new <a href="https://tailwindui.com/components/marketing/sections/feature-sections#component-fea10362c98dcf74d601fab911a1aee3" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Feature Section</a> examples to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 3 new <a href="https://tailwindui.com/components/marketing/sections/heroes#component-6364cb4174b8dfdfbd7fa71ac72ab862" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Hero Section</a> examples to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/marketing/sections/content-sections#component-f6c39bd93fbb747d288f373cdbc039e3" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Content Section</a> example to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/marketing/sections/newsletter-sections#component-40876829251fe25b599a14d6ab91ac3a" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Newsletter Section</a> example to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/marketing/sections/stats-sections#component-dcac76884a5471d1bbc2b95d1526d7a9" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stat Section</a> example to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/marketing/sections/testimonials#component-c5694e9aacc7edd691e3234d067adc62" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Testimonial</a> example to the Marketing package</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2021-01-11" aria-labelledby="2021-01-11-heading" class="md:flex">
										<h2 id="2021-01-11-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2021-01-11">January 11, 2021</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/layout/list-containers" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">List Containers</a> category to the Application UI package with 7 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/layout/dividers" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Dividers</a> category to the Application UI package with 8 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/page-examples/home-screens#component-a75fa56c99de07250d40ffcf1c70283f" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Home Screen</a> page example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/application-ui/lists/stacked-lists#component-887cb27d2a36c9d38afe44b19d9a44c5" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stacked List</a> examples to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/lists/grid-lists#component-a26a744b444974a4cc73cb5886b8da6a" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Grid List</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/headings/page-headings#component-9a6c0d01eb626ce1c5a63141be2e5271" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Page Heading</a> example to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/application-shells/stacked#component-d3429709d7862763cc93bbc60777c0fe" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stacked Layout</a> application shell example to the Application UI package</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-12-18" aria-labelledby="2020-12-18-heading" class="md:flex">
										<h2 id="2020-12-18-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-12-18">December 18, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/page-examples/detail-screens" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Details Screens</a> page examples to the Application UI package with 3 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/application-shells/multi-column" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Multi-Column Layouts</a> category to the Application UI package with 3 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/lists/feeds" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Feeds</a> category to the Application UI package with 3 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/layout/media-objects" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Media Objects</a> category to the Application UI package with 8 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/application-ui/elements/buttons#component-f89ee8e6bf0a50f7daf4fa035c4a5dc4" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Buttons examples</a> to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/lists/grid-lists#component-08e8555b844010db1f30cbafc8be6222" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Grid List example</a> the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/application-ui/headings/page-headings#component-6fae9e848a855282e0d7fc637cb94791" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Page Headings examples</a> to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/lists/stacked-lists#component-f426e5b090a3887f40863034589d365b" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stacked List example</a> to the Application UI package</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-11-01" aria-labelledby="2020-11-01-heading" class="md:flex">
										<h2 id="2020-11-01-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-11-01">November 1, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/page-examples/settings-screens" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Settings Screens category</a> to the Application UI package with 4 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/navigation/breadcrumbs" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Breadcrumbs category</a> to the Application UI package with 4 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/application-shells/stacked#component-2c220920c5e70d33aeaa56deb4df3f0e" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stacked Layout example</a> to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/data-display/description-lists#component-7a07446d5ac240767202f521f7065893" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Description List example</a> to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/forms/form-layouts#component-d45285168387e95ed939cc1a91e8e19c" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Form Layout example</a> to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/application-ui/navigation/navbars#component-031f259ad35e12ad49e6cd45cb512e07" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Navbar examples</a> to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/forms/radio-groups" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Radio Groups category</a> to the Application UI package with 3 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/application-shells/sidebar#component-966a548c3d7225d9155a443e979057b5" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Sidebar Layout example</a> to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/application-ui/forms/toggles" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Toggle examples</a> to the Application UI package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 1 new <a href="https://tailwindui.com/components/application-ui/lists/stacked-lists#component-43253d4065559b08c65a0d2918310810" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stacked List example</a> to the Application UI package</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-10-02" aria-labelledby="2020-10-02-heading" class="md:flex">
										<h2 id="2020-10-02-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-10-02">October 2, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/marketing/page-examples/pricing-pages" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Pricing Pages</a> category to the Marketing package with 4 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/marketing/sections/header" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Header Sections</a> category to the Marketing package with 3 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 4 new <a href="https://tailwindui.com/components/marketing/sections/pricing" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Pricing Section</a> examples to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/marketing/sections/cta-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">CTA Section</a> examples to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 3 new <a href="https://tailwindui.com/components/marketing/sections/faq-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">FAQ Section</a> examples to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 3 new <a href="https://tailwindui.com/components/marketing/sections/feature-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Feature Section</a> examples to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/marketing/sections/footers" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Footer Section</a> examples to the Marketing package</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 2 new <a href="https://tailwindui.com/components/marketing/sections/logo-clouds" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Logo Cloud</a> examples to the Marketing package</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-08-19" aria-labelledby="2020-08-19-heading" class="md:flex">
										<h2 id="2020-08-19-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-08-19">August 19, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/marketing/sections/team-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Team Sections</a> category to the Marketing package with 8 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/headings/section-headings" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Section Headings</a> category to the Application UI package with 9 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/navigation/steps" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Steps</a> category to the Application UI package with 7 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added 5 new <a href="https://tailwindui.com/components/application-ui/overlays/slide-overs" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Slide-Over</a> examples to the Application UI package</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-07-31" aria-labelledby="2020-07-31-heading" class="md:flex">
										<h2 id="2020-07-31-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-07-31">July 31, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added the first three <a href="https://tailwindui.com/components/application-ui/page-examples/home-screens" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Home Screen Examples</a> to the Application UI package</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-07-20" aria-labelledby="2020-07-20-heading" class="md:flex">
										<h2 id="2020-07-20-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-07-20">July 20, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/marketing/sections/content-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Content Sections</a> category to the Marketing package, with 5 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/navigation/sidebar-navigation" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Sidebar Navigation</a> category to the Application UI package, with 8 examples</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-07-03" aria-labelledby="2020-07-03-heading" class="md:flex">
										<h2 id="2020-07-03-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-07-03">July 3, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/lists/grid-lists" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Grid Lists</a> category to the Application UI package, with 3 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added three new <a href="https://tailwindui.com/components/marketing/sections/heroes" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Hero Section</a> examples to the Marketing package</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-06-19" aria-labelledby="2020-06-19-heading" class="md:flex">
										<h2 id="2020-06-19-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-06-19">June 19, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/overlays/slide-overs" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Slide-Overs</a> category to the Application UI package, with 6 examples</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-06-09" aria-labelledby="2020-06-09-heading" class="md:flex">
										<h2 id="2020-06-09-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-06-09">June 9, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/forms/select-menus" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Select Menus</a> category to the Application UI package, with 6 examples</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-05-06" aria-labelledby="2020-05-06-heading" class="md:flex">
										<h2 id="2020-05-06-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-05-06">May 6, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/marketing/elements/headers" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Headers</a> category to the Marketing package, with 4 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/marketing/elements/flyout-menus" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Flyout Menus</a> category to the Marketing package, with 6 examples</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-04-07" aria-labelledby="2020-04-07-heading" class="md:flex">
										<h2 id="2020-04-07-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-04-07">April 7, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/feedback/alerts" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Alerts</a> category to the Application UI package, with 6 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/marketing/sections/contact-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Contact Sections</a> category to the Marketing package, with 6 examples</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Fixed border color above profile section in sidebar of <a href="https://tailwindui.com/components/application-ui/application-shells/stacked#component-e1d4a342c5903e8ade21c57c20448d69" inertia="" class="mt-[1.14286em] text-sky-500 font-semibold no-underline">Branded Nav with Compact White Page Header</a> stacked layout (from <code class="text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">border-gray-700</code> to <code class="mb-[1.14286em] text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">border-indigo-800</code>)</li>
												</ul>
											</div>
										</div>
									</section>
									<section id="2020-03-25" aria-labelledby="2020-03-25-heading" class="md:flex">
										<h2 id="2020-03-25-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
											<a href="#2020-03-25">March 25, 2020</a>
										</h2>
										<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
											<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
											</div>
											<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
											</div>
											<div class="max-w-none text-sm leading-[1.71429]">
												<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/data-display/stats" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stats</a> category to the Application UI package, with 3 components to start</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/overlays/notifications" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Notifications</a> category to the Application UI package, with 6 components to start</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/marketing/sections/blog-sections" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Blog Sections</a> category to the Marketing package, with 3 components to start</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Corrected <code class="mt-[1.14286em] text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">flex-no-shrink</code> to <code class="text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">flex-shrink-0</code> on <a href="https://tailwindui.com/components/application-ui/forms/toggles" inertia="" class="mb-[1.14286em] text-sky-500 font-semibold no-underline">Toggle</a> components</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Fixed truncation issue in Firefox on <a href="https://tailwindui.com/components/application-ui/data-display/description-lists" inertia="" class="mt-[1.14286em] text-sky-500 font-semibold no-underline">Description List</a> components (see <a href="https://github.com/tailwindui/issues/issues/71" class="mb-[1.14286em] text-sky-500 font-semibold no-underline">https://github.com/tailwindui/issues/issues/71</a>)</li>
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Fixed off-canvas menu in sidebar layouts being too wide for very small screens (see <a href="https://github.com/tailwindui/issues/issues/2" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">https://github.com/tailwindui/issues/issues/2</a>)</li>
												</ul>
												<h3 class="text-base text-slate-900 font-semibold m-0">Accessibility improvements</h3>
												<p class="m-0">We started working with an accessibility consultant this week who has been going through our early access components and making sure we're following all best practices.</p>
												<ul class="list-disc list-image-none m-0 p-0">
													<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Link toggle on <a href="https://tailwindui.com/components/application-ui/forms/action-panels#component-575df646e77ef070900d616c26a521e7" inertia="" class="mt-[1.14286em] text-sky-500 font-semibold no-underline">Action panel with toggle</a> to title/description through <code class="text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">aria-labelledby</code> and <code class="mb-[1.14286em] text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">aria-describedby</code>
												</li>
												<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Add alt attribute to logo images in <a href="https://tailwindui.com/components/application-ui/application-shells/stacked" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stacked Layouts</a>
											</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Add <code class="mt-[1.14286em] text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">aria-label</code> attribute to icon-only buttons in <a href="https://tailwindui.com/components/application-ui/application-shells/stacked" inertia="" class="text-sky-500 font-semibold no-underline">Stacked Layouts</a> (like <code class="mb-[1.14286em] text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">aria-label="Notifications"</code> on the bell buttons)</li>
											<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Add menu semantics to the avatar dropdowns on <a href="https://tailwindui.com/components/application-ui/application-shells/stacked" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Stacked Layouts</a>
										</li>
									</ul>
								</div>
							</div>
						</section>
						<section id="2020-03-06" aria-labelledby="2020-03-06-heading" class="md:flex">
							<h2 id="2020-03-06-heading" class="pl-7 text-sm text-slate-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right m-0">
								<a href="#2020-03-06">March 6, 2020</a>
							</h2>
							<div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0">
								<div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-6 md:top-0">
								</div>
								<div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]">
								</div>
								<div class="max-w-none text-sm leading-[1.71429]">
									<h3 class="text-base text-slate-900 font-semibold m-0">New additions</h3>
									<ul class="list-disc list-image-none m-0 p-0">
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/forms/action-panels" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Action Panels</a> category, with 8 components to start</li>
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/layout/containers" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Layout Containers</a> category, with 4 components to start</li>
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added new <a href="https://tailwindui.com/components/application-ui/layout/panels" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">Layout Panels</a> category, with 10 components to start</li>
										<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added two new <a href="https://tailwindui.com/components/application-ui/forms/form-layouts" inertia="" class="mt-[1.14286em] text-sky-500 font-semibold no-underline">Form Layout</a> examples <em class="mb-[1.14286em]">(two-column cards with separate submit actions and two-column in full-width cards)</em>
									</li>
									<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added a new <a href="https://tailwindui.com/components/marketing/sections/pricing#component-d91bc5ed1deb87275decb69f70274650" inertia="" class="mb-[1.14286em] mt-[1.14286em] text-sky-500 font-semibold no-underline">"Three-tier with emphasized tier"</a> pricing section example</li>
									<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Added <a href="https://tailwindui.com/components/marketing/elements/banners" inertia="" class="mt-[1.14286em] text-sky-500 font-semibold no-underline">Marketing Banners</a>, with 4 components <em class="mb-[1.14286em]">(we had these done on day one but they've been accidentally invisible the whole time due to a configuration typo! Derp.)</em>
								</li>
								<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Fixed focus/active styles for buttons in <a href="https://tailwindui.com/components/application-ui/headings/page-headings" inertia="" class="mt-[1.14286em] text-sky-500 font-semibold no-underline">Page Headings</a> and <a href="https://tailwindui.com/components/application-ui/headings/card-headings" inertia="" class="text-sky-500 font-semibold no-underline">Card Headings</a>
								<em class="mb-[1.14286em]">(these were slightly inconsistent with the button styles we use elsewhere in Tailwind UI)</em>
							</li>
							<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">Tweaked padding on footer of <a href="https://tailwindui.com/components/application-ui/overlays/modals#component-47a5888a08838ad98779d50878d359b3" inertia="" class="mt-[1.14286em] text-sky-500 font-semibold no-underline">Modal with gray footer</a> component <em class="mb-[1.14286em]">(we had used <code class="text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">py-4</code> initially but <code class="text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">py-3</code> is more consistent)</em>
						</li>
						<li class="pl-[0.428571em] mt-[0.285714em] mb-[0.285714em]">We had <code class="mt-[1.14286em] text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">dd</code> and <code class="mb-[1.14286em] text-slate-900 font-semibold [font-variation-settings:normal] text-[1em]">dt</code> elements backwards on our description list components — we've fixed that now!</li>
					</ul>
				</div>
			</div>
		</section>
	</div>
`;

export const Timeline = () => {
  return (
    <div className="flex flex-col items-center space-y-4 p-8">
      <div className="mb-8 flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl font-bold md:text-6xl">
          What's next for CraftGen?
        </h1>
        <p className="text-muted-foreground text-xl">
          Here is a list of the features we are working on, and the progress we
          have made so far.
        </p>
      </div>
      <nav aria-label="Progress">
        <ol role="list" className="max-w-2xl overflow-hidden">
          {steps.map((step, stepIdx) => (
            <li
              key={step.name}
              className={cn(
                stepIdx !== steps.length - 1 ? "pb-4" : "",
                "relative",
              )}
            >
              {step.status === "complete" ? (
                <>
                  {stepIdx !== steps.length - 1 ? (
                    <div
                      className="bg-primary absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5"
                      aria-hidden="true"
                    />
                  ) : null}
                  <a
                    href={step.href}
                    className="group relative flex items-start justify-center "
                  >
                    <span className="flex h-9 items-center">
                      <span className="bg-primary group-hover:bg-primary-foreground relative z-10 flex h-8 w-8 items-center justify-center rounded-full">
                        <CheckIcon
                          className="h-5 w-5 text-white"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                    <span className="ml-4 flex w-full min-w-0 flex-col rounded border p-4">
                      <span className="text-sm font-medium">{step.name}</span>
                      <span className="text-muted-foreground text-sm">
                        {step.description}
                      </span>
                    </span>
                  </a>
                </>
              ) : step.status === "current" ? (
                <>
                  {stepIdx !== steps.length - 1 ? (
                    <div
                      className="bg-muted absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5"
                      aria-hidden="true"
                    />
                  ) : null}
                  <a
                    href={step.href}
                    className="group relative flex items-start"
                    aria-current="step"
                  >
                    <span className="flex h-9 items-center" aria-hidden="true">
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                      </span>
                    </span>
                    <span className="ml-4 flex w-full min-w-0 flex-col rounded border p-4">
                      <span className="text-sm font-medium text-indigo-600">
                        {step.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {step.description}
                      </span>
                    </span>
                  </a>
                </>
              ) : (
                <>
                  {stepIdx !== steps.length - 1 ? (
                    <div
                      className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                      aria-hidden="true"
                    />
                  ) : null}
                  <a
                    href={step.href}
                    className="group relative flex items-start"
                  >
                    <span className="flex h-9 items-center" aria-hidden="true">
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
                        <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                      </span>
                    </span>
                    <span className="ml-4 flex w-full min-w-0 flex-col rounded border p-4">
                      <span className="text-sm font-medium text-gray-500">
                        {step.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {step.description}
                      </span>
                    </span>
                  </a>
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};
