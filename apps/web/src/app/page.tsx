"use client";

import { ModeToggle } from "@/components/theme-toggle";
import { api } from "@/trpc/react";

// import { api } from "@/trpc/server";
import Hero from "./hero";

export default function Home() {
  const projects = api.post.all.useQuery();
  // const supabase = createServerComponentClient<Database>({ cookies });
  // const {
  //   data: { session },
  // } = await supabase.auth.getSession();
  // const ref = useRef<HTMLDivElement>(null);
  return (
    <main className="flex min-h-screen flex-col items-center justify-start ">
      {/* <div className="flex items-center justify-between bg-muted w-full h-10 p-4">
        <div></div>
        <div>
          <Link href="/dashboard" className="font-bold">
            Dashboard
          </Link>
          <Link href="/login" className="font-bold">
            Login
          </Link>
        </div>
      </div> */}
      <div className="flex w-full justify-end p-1">
        <ModeToggle />
      </div>
      <Hero />
      {/* <Scene>
        <div className="grid grid-cols-2" ref={ref}>
          <div className="flex flex-col p-20 justify-around items-start h-full">
            <h1 className="text-7xl font-black">
              <span className="text-red-600">SEO</span>CRAFT
            </h1>
            <p className="py-4 text-3xl">
              SEOcraft is a node-based content crafting platform designed to
              revolutionize the way you create articles, images, and content.
              With intuitive drag-and-drop functionality, users can
              programmatically design content, tailoring every aspect to their
              unique needs. . Whether you&apos;re enhancing your SEO or building
              a robust content marketing strategy, SEOCRAFT provides the tools
              to craft your success.
            </p>
            <Waitlist containerRef={ref} />
          </div>
          <div className="flex items-center justify-center">
            <Image
              alt="seocraft v0 screenshot"
              src="/images/screenshot.png"
              className="w-full"
              width={600}
              height={400}
            />
          </div>
        </div>
      </Scene> */}
      {/* <Scene>
        <div>
          <section className="py-12  sm:py-16 lg:py-20 xl:py-24">
            <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
              <div className="text-center">
                <p className="text-sm font-normal tracking-widest text-white uppercase">
                  In the media
                </p>
              </div>

              <div className="grid max-w-6xl grid-cols-1 mx-auto mt-12 md:grid-cols-2 gap-x-24 sm:mt-16 lg:mt-20 gap-y-16">
                <div>
                  <img
                    className="w-auto h-8"
                    src="https://landingfoliocom.imgix.net/store/collection/dusk/images/testimonial/5/techcrunch-logo.svg"
                    alt=""
                  />
                  <blockquote>
                    <p className="mt-10 text-xl font-normal text-white">
                      “Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Aenean vitae et ultricies sapien mauris, urna. Arcu justo,
                      tellus in tellus, sed sed venenatis velit. Nisl nam augue
                      elit at viverra euismod vitae. Est praesent mattis.”
                    </p>
                  </blockquote>
                  <div className="inline-flex flex-col mt-6 md:mt-10">
                    <a
                      href="#"
                      title=""
                      className="text-base font-normal text-white"
                    >
                      Read the article
                    </a>
                    <div className="w-full h-px mt-1 bg-gradient-to-r from-cyan-500 to-purple-500 "></div>
                  </div>
                </div>

                <div>
                  <img
                    className="w-auto h-8"
                    src="https://landingfoliocom.imgix.net/store/collection/dusk/images/testimonial/5/new-york-times-logo.svg"
                    alt=""
                  />
                  <blockquote>
                    <p className="mt-10 text-xl font-normal text-white">
                      “Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Aenean vitae et ultricies sapien mauris, urna. Arcu justo,
                      tellus in tellus, sed sed venenatis velit. Nisl nam augue
                      elit at viverra euismod vitae. Est praesent mattis.”
                    </p>
                  </blockquote>
                  <div className="inline-flex flex-col mt-6 md:mt-10">
                    <a
                      href="#"
                      title=""
                      className="text-base font-normal text-white"
                    >
                      Read the article
                    </a>
                    <div className="w-full h-px mt-1 bg-gradient-to-r from-cyan-500 to-purple-500 "></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Scene>
      <Scene>
        <h4 className="text-4xl font-bold">
          Tired of the traditional approach to content creation? Welcome to the
          next level. Break free from limitations with SEOcraft, your one-stop
          solution for crafting content like never before.
        </h4>
      </Scene>
      <Scene>
        <h2>AI-Integrated Brilliance:</h2>
        <p>
          Imagine having the brainpower of leading AI models from Huggingface &
          Replicate right at your fingertips. Well, with SEOcraft, that&apos;s
          exactly what you get. Tailor content, analyze trends, and develop
          strategies that resonate. And the best part? You control the key,
          ensuring full autonomy and flexibility.
        </p>
      </Scene> */}
    </main>
  );
}

// Unleash the Power of Node-Based Editing:
// SEOcraft is a node-based content crafting platform that transforms how you design articles, images, and multimedia content. Think of it as your canvas, where you can create, edit, and arrange elements programmatically. Forget the constraints of ordinary editors; this is where creativity meets innovation.

// AI-Integrated Brilliance:
// Imagine having the brainpower of leading AI models from Huggingface & Replicate right at your fingertips. Well, with SEOcraft, that&apos;s exactly what you get. Tailor content, analyze trends, and develop strategies that resonate. And the best part? You control the key, ensuring full autonomy and flexibility.

// A New Way to Craft Content:
// SEOcraft&apos;s interactive editor lets you connect the dots - literally. With our drag-and-drop functionality, you can build complex content structures with ease, personalizing every detail. From SEO-optimized articles to captivating visuals, it&apos;s all within reach.

// Dynamic and Scalable:
// Growing your online presence? SEOcraft scales with you. Create hundreds of unique articles, design eye-catching images, and expand your reach without breaking a sweat. Our platform is built to accommodate your growth, no matter how fast you&apos;re moving.

// Content Creation, Redefined:
// Forget the static and predictable. SEOcraft opens a world where you can craft content that speaks to your audience, engages the reader, and ranks on search engines. From a single blog post to an entire multimedia campaign, it&apos;s all possible with SEOcraft.

// No More Waiting:
// With parallel processing and dedicated mechanisms, SEOcraft is one of the fastest and most scalable bulk content creators available. No more time-consuming loading or delays. Create content clusters in minutes and focus on what really matters.

// Bring Your Own Key, Build Your Future:
// Your security and control are paramount. SEOcraft&apos;s Bring-Your-Own-Key model ensures you&apos;re always in the driver&apos;s seat. It&apos;s your vision, your key, your success.

// Interactive Preview:
// Want to see how it all comes together?

// Experience the revolution of content crafting with our interactive editor. Play around, connect nodes, and unleash creativity.

// No Jargon, No Confusion:
// SEOcraft is designed to be intuitive and user-friendly. Whether you&apos;re a seasoned content strategist or just starting, you&apos;ll find your groove in no time.

// Ready to Craft Your Success?
// Stop settling for ordinary. Embrace the future of content creation with SEOcraft. This is where you craft your success, where your creativity knows no bounds. What are you waiting for?

// Sign Up Now!
