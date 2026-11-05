import '@angular/compiler';
import { enableProdMode } from '@angular/core';
enableProdMode();
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication, provideServerRendering } from '@angular/platform-server';
import { AngularApp } from './.generated/angular-compiled/AngularApp.js';
export const render = () => renderApplication(context => bootstrapApplication(AngularApp, {providers:[provideServerRendering()]}, context), {document:'<!doctype html><html><head></head><body><integration-root></integration-root></body></html>',url:'http://localhost/',allowedHosts:['localhost']});
