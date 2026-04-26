import React from 'react';
import { Button } from '@raisin/design-system';

const UseCase1: React.FC = () => (
  <div className="wrapper">
    <div className="container">
      <div id="welcome">
        <h1>
          <span>This page is served from app1</span>
          Hey there, this is the home page
        </h1>
      </div>
      <div id="hero" className="rounded custom-hero">
        <div className="text-container">
          <h2>
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="https://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            <span>
              All the content on this page has been prefetched and generated into the page at build
              time.
            </span>
          </h2>
          <Button variant="contained" href="/app2" component="a">
            Take me to app2
          </Button>
          <Button variant="contained" href="/app3" component="a">
            Take me to app3
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export default UseCase1;
