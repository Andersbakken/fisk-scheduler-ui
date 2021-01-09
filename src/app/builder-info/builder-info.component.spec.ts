import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuilderInfoComponent } from './builder-info.component';

describe('BuilderInfoComponent', () => {
  let component: BuilderInfoComponent;
  let fixture: ComponentFixture<BuilderInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuilderInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuilderInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
