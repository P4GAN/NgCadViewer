import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadTreeComponent } from './cad-tree.component';

describe('CadTreeComponent', () => {
  let component: CadTreeComponent;
  let fixture: ComponentFixture<CadTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadTreeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CadTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
