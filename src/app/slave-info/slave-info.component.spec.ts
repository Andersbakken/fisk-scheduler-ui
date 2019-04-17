import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SlaveInfoComponent } from './slave-info.component';

describe('SlaveInfoComponent', () => {
  let component: SlaveInfoComponent;
  let fixture: ComponentFixture<SlaveInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SlaveInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SlaveInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
