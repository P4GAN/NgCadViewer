import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgCadViewer } from './ng-cad-viewer';

describe('NgCadViewer', () => {
  let component: NgCadViewer;
  let fixture: ComponentFixture<NgCadViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgCadViewer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgCadViewer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
